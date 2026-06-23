/**
 * Adaptive rescheduling — replans remaining topics based on actual progress.
 *
 * Per D-05: preserves isManual=true slots during regeneration
 * Per D-06: reuses distribute.ts round-robin with startDate = today
 * Per D-07: topics keep original ordering (no difficulty-based reweighting)
 * Per D-08: missed past topics are auto-redistributed alongside pending topics
 * Per D-09: revision slots are preserved untouched
 * Per D-10: past-due revision slots left in place
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
};

const PLANNING_FALACY_BUFFER = 1.25;
const CAPACITY_RATIO = 0.7;
const MAX_MINUTES_PER_DAY = 240;
const CATCHUP_DAYS_PER_WEEK = 1;

/**
 * Regenerate schedule from today based on actual vs planned progress.
 * Only affects non-completed, non-manual study slots.
 * Revision slots (revision-7d, revision-30d) are preserved untouched.
 * Completed slots are preserved untouched.
 * isManual=true slots (user drag-dropped) are preserved untouched.
 */
export async function adaptSchedule(input: AdaptInput): Promise<void> {
  const { planId } = input;
  const today = format(new Date(), "yyyy-MM-dd");

  // 1. Get plan details
  const plan = await db
    .select()
    .from(studyPlans)
    .where(eq(studyPlans.id, planId))
    .get();

  if (!plan) throw new Error("Plan not found");
  if (!plan.hoursPerWeek || !plan.studyDays) throw new Error("Study availability not configured");
  if (!plan.startDate || !plan.deadline) throw new Error("Plan has no date range");

  const studyDaysArray = plan.studyDays.split(",").map(Number).filter((d) => !isNaN(d));
  const deadline = plan.deadline;

  // If today is past the deadline, use the deadline as the redistribution window end
  const effectiveStart = today > deadline ? deadline : today;

  // 2. Get all existing schedule slots for this plan
  const allSlots = await db
    .select()
    .from(scheduleSlots)
    .where(eq(scheduleSlots.planId, planId))
    .all();

  // 3. Categorize slots into groups
  const completedSlots = allSlots.filter((s) => s.isCompleted);
  const manualSlots = allSlots.filter((s) => s.isManual && !s.isCompleted);
  const revisionSlots = allSlots.filter(
    (s) => (s.type === "revision-7d" || s.type === "revision-30d") && !s.isCompleted
  );
  const autoPendingSlots = allSlots.filter(
    (s) =>
      s.type === "study" &&
      !s.isCompleted &&
      !s.isManual
  );
  const bufferCatchupSlots = allSlots.filter(
    (s) => (s.type === "buffer" || s.type === "catch-up") && !s.isCompleted
  );

  // 4. Collect topics to redistribute: topic IDs from autoPendingSlots
  const pendingTopicIds = [
    ...new Set(autoPendingSlots.map((s) => s.topicId).filter(Boolean)),
  ];

  if (pendingTopicIds.length === 0) {
    // Nothing to redistribute — plan is complete or all slots are manual
    return;
  }

  // 5. Get topic data for the pending topics from the plan
  const allPlanTopics = await getTopicsForPlan(planId);
  const topicsToRedistribute = allPlanTopics.filter((t) =>
    pendingTopicIds.includes(t.id)
  );

  if (topicsToRedistribute.length === 0) {
    return; // No matching topics found (shouldn't happen, but guard)
  }

  // 6. Calculate remaining days and check feasibility
  const remainingDays = differenceInDays(deadline, effectiveStart) + 1;
  const remainingWeeks = Math.ceil(remainingDays / 7);
  const totalAdjustedHours = topicsToRedistribute.reduce(
    (sum, t) => sum + t.estimatedHours * PLANNING_FALACY_BUFFER,
    0
  );
  const totalAvailableHours = (plan.hoursPerWeek ?? 10) * remainingWeeks;
  const totalUsableHours = totalAvailableHours * CAPACITY_RATIO;

  // 7. If not feasible, throw with clear message (user must adjust settings)
  if (totalAdjustedHours > totalUsableHours) {
    throw new Error(
      `Not enough time remaining: ~${Math.round(totalAdjustedHours)}h needed, ~${Math.round(totalUsableHours)}h available in ${remainingWeeks} week(s). Try extending the deadline or reducing topics.`
    );
  }

  // 8. Redistribute via distribute.ts with startDate = effectiveStart (D-06)
  const result = await generateSchedule({
    planId,
    topics: topicsToRedistribute,
    startDate: effectiveStart,
    deadline,
    hoursPerWeek: plan.hoursPerWeek ?? 10,
    studyDays: studyDaysArray,
  });

  if (!result.feasibility.possible) {
    throw new Error(result.feasibility.message ?? "Cannot redistribute remaining topics");
  }

  // 9. Build final slot list and write to DB in a transaction
  await db.transaction(async (tx) => {
    // 9a. Delete non-completed, non-manual, non-revision slots
    //     (auto-pending study slots + buffer/catch-up — these get replaced)
    for (const slot of autoPendingSlots) {
      await tx.delete(scheduleSlots).where(eq(scheduleSlots.id, slot.id));
    }
    for (const slot of bufferCatchupSlots) {
      await tx.delete(scheduleSlots).where(eq(scheduleSlots.id, slot.id));
    }

    // 9b. Insert new distributed study slots
    for (const slot of result.slots) {
      await tx.insert(scheduleSlots).values({
        id: crypto.randomUUID(),
        planId: slot.planId,
        topicId: slot.topicId,
        date: slot.date,
        type: "study" as const,
        estimatedMinutes: slot.estimatedMinutes,
        isCompleted: false,
        isManual: false,
      });
    }

    // 9c. Determine catch-up day type assignments based on study days
    //     Generate buffer/catch-up slots for the remaining window
    //     Reuse the catchUpDates from the generateSchedule result
    const catchUpDateSet = new Set(result.catchUpDates);
    // For each day in the remaining window that's a study day,
    // if it's a catch-up date, don't add a buffer (catch-up label shown by calendar)
    // We just leave catch-up dates as-is — the day-cell component handles the visual
    // via hasCatchUp check. No extra slots needed — the calendar shows catch-up
    // based on day-of-week logic, not explicit slots.

    // 9d. Update plan metadata
    await tx
      .update(studyPlans)
      .set({
        lastScheduleGeneratedAt: new Date().toISOString(),
        lastScheduleHoursPerWeek: plan.hoursPerWeek,
        lastScheduleStudyDays: plan.studyDays,
        lastScheduleStartDate: effectiveStart,
        lastScheduleDeadline: plan.deadline,
      })
      .where(eq(studyPlans.id, planId));
  });
}

/**
 * Detect whether a plan needs adaptive rescheduling.
 * Compares planned vs actual completions — flags if >20% behind.
 */
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

  // Flag if >20% behind expected pace
  return behindBy > Math.max(1, Math.round(plan.totalTopics * 0.2));
}
