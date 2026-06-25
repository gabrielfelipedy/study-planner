/**
 * Adaptive rescheduling — replans remaining topics based on actual progress.
 *
 * Past uncompleted topics (both manual and auto) are redistributed.
 * Future isManual=true slots and completed slots are preserved.
 * Reuses distribute.ts even-spread with startDate = today.
 * Revision slots are preserved untouched.
 */

import { db } from "@/lib/db/client";
import { scheduleSlots, studyPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { format } from "date-fns";
import { generateSchedule } from "@/lib/dal/scheduler/distribute";
import { getTopicsForPlan } from "@/lib/dal/queries/plans";

export type AdaptInput = {
  planId: string;
  userId: string;
  startDateOverride?: string;
  weekdaysOverride?: string;
};

export async function adaptSchedule(
  input: AdaptInput
): Promise<{ warning?: string }> {
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

  if (today > deadline) {
    return { warning: "Deadline has ended. Cannot modify schedule." };
  }

  const effectiveStart = input.startDateOverride ?? today;

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
    return {};
  }

  const allPlanTopics = await getTopicsForPlan(planId);
  const topicsToRedistribute = allPlanTopics.filter((t) =>
    pendingTopicIds.includes(t.id)
  );

  if (topicsToRedistribute.length === 0) {
    return {};
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

  if (result.slots.length === 0) {
    return { warning: "No remaining study days available for rescheduling." };
  }

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

  return {};
}


