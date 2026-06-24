/**
 * Adaptive rescheduling — replans remaining topics based on actual progress.
 *
 * Preserves isManual=true slots during regeneration.
 * Reuses distribute.ts even-spread with startDate = today.
 * Missed past topics are auto-redistributed alongside pending topics.
 * Revision slots are preserved untouched.
 */

import { db } from "@/lib/db/client";
import { scheduleSlots, studyPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { format, differenceInDays } from "date-fns";
import { generateSchedule } from "@/lib/dal/scheduler/distribute";
import { getTopicsForPlan } from "@/lib/dal/queries/plans";

export type AdaptInput = {
  planId: string;
  userId: string;
  startDateOverride?: string;
  weekdaysOverride?: string;
};

export async function adaptSchedule(input: AdaptInput): Promise<void> {
  const { planId } = input;

  const plan = await db
    .select()
    .from(studyPlans)
    .where(eq(studyPlans.id, planId))
    .get();

  if (!plan) throw new Error("Plan not found");
  if (!plan.startDate || !plan.deadline) throw new Error("Plan has no date range");

  const today = format(new Date(), "yyyy-MM-dd");
  const deadline = plan.deadline;
  const effectiveStart = input.startDateOverride ?? (today > deadline ? deadline : today);

  const allSlots = await db
    .select()
    .from(scheduleSlots)
    .where(eq(scheduleSlots.planId, planId))
    .all();

  const pastPendingSlots = allSlots.filter(
    (s) =>
      s.type === "study" &&
      !s.isCompleted &&
      s.date < today
  );

  const pendingTopicIds = [
    ...new Set(pastPendingSlots.map((s) => s.topicId).filter(Boolean)),
  ];

  if (pendingTopicIds.length === 0) {
    return;
  }

  const allPlanTopics = await getTopicsForPlan(planId);
  const topicsToRedistribute = allPlanTopics.filter((t) =>
    pendingTopicIds.includes(t.id)
  );

  if (topicsToRedistribute.length === 0) {
    return;
  }

  const weekdaysStr = input.weekdaysOverride ?? plan.weekdays;
  const weekdays = weekdaysStr
    ? weekdaysStr.split(",").map(Number)
    : undefined;

  const pastPendingIds = new Set(pastPendingSlots.map((s) => s.id));
  const retainedCounts: Record<string, number> = {};
  for (const s of allSlots) {
    if (s.type !== "study") continue;
    if (pastPendingIds.has(s.id)) continue;
    retainedCounts[s.date] = (retainedCounts[s.date] ?? 0) + 1;
  }

  const result = await generateSchedule({
    planId,
    topics: topicsToRedistribute,
    startDate: effectiveStart,
    deadline,
    weekdays,
    existingCountsByDate: retainedCounts,
  });

  await db.transaction(async (tx) => {
    for (const slot of pastPendingSlots) {
      await tx.delete(scheduleSlots).where(eq(scheduleSlots.id, slot.id));
    }

    for (const slot of result.slots) {
      await tx.insert(scheduleSlots).values({
        id: crypto.randomUUID(),
        planId: slot.planId,
        topicId: slot.topicId,
        date: slot.date,
        type: "study" as const,
        isCompleted: false,
        isManual: false,
      });
    }

    await tx
      .update(studyPlans)
      .set({
        lastScheduleGeneratedAt: new Date().toISOString(),
        lastScheduleStartDate: plan.startDate,
        lastScheduleDeadline: plan.deadline,
      })
      .where(eq(studyPlans.id, planId));
  });
}

export async function needsAdaptation(planId: string): Promise<boolean> {
  const plan = await db
    .select({
      startDate: studyPlans.startDate,
      deadline: studyPlans.deadline,
      totalTopics: studyPlans.totalTopics,
      completedTopics: studyPlans.completedTopics,
    })
    .from(studyPlans)
    .where(eq(studyPlans.id, planId))
    .get();

  if (!plan || !plan.totalTopics || !plan.startDate || !plan.deadline) return false;

  const today = format(new Date(), "yyyy-MM-dd");
  const totalDays = differenceInDays(plan.deadline, plan.startDate) + 1;
  const daysElapsed = differenceInDays(today, plan.startDate) + 1;
  const expectedCompletions = Math.round((daysElapsed / totalDays) * plan.totalTopics);
  const behindBy = Math.max(0, expectedCompletions - (plan.completedTopics ?? 0));

  return behindBy > Math.max(1, Math.round(plan.totalTopics * 0.2));
}
