"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/client";
import { scheduleSlots, studyPlans } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateSchedule } from "@/lib/dal/scheduler/distribute";
import { saveSchedule } from "@/lib/dal/commands/schedule";
import { getPlanById, getTopicsForPlan } from "@/lib/dal/queries/plans";

export type GenerateResult = {
  success: boolean;
  message?: string;
  totalDays?: number;
  avgTopicsPerDay?: number;
};

export type MoveSlotInput = {
  slotId: string;
  targetDate: string;
};

export async function generateScheduleAction(
  planId: string
): Promise<GenerateResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, message: "Not authenticated" };
  }

  const plan = await getPlanById(planId, session.user.id);
  if (!plan) {
    return { success: false, message: "Plan not found" };
  }

  const topics = await getTopicsForPlan(planId);
  if (topics.length === 0) {
    return { success: false, message: "No topics in this plan" };
  }

  if (!plan.hoursPerWeek || !plan.studyDays) {
    return { success: false, message: "Set your study availability first" };
  }

  const studyDays = plan.studyDays.split(",").map(Number).filter((d) => !isNaN(d));
  if (studyDays.length === 0) {
    return { success: false, message: "Select at least one study day" };
  }

  const result = await generateSchedule({
    planId,
    topics,
    startDate: plan.startDate,
    deadline: plan.deadline,
    hoursPerWeek: plan.hoursPerWeek ?? 10,
    studyDays,
  });

  if (!result.feasibility.possible) {
    return {
      success: false,
      message: result.feasibility.message ?? "Not enough study time available",
    };
  }

  await saveSchedule(planId, result.slots);

  await db
    .update(studyPlans)
    .set({
      lastScheduleGeneratedAt: new Date().toISOString(),
      lastScheduleHoursPerWeek: plan.hoursPerWeek,
      lastScheduleStudyDays: plan.studyDays,
      lastScheduleStartDate: plan.startDate,
      lastScheduleDeadline: plan.deadline,
    })
    .where(eq(studyPlans.id, planId));

  revalidatePath(`/plans/${planId}`);

  const studySlotCount = result.slots.filter((s) => s.type === "study").length;
  const uniqueDates = new Set(result.slots.map((s) => s.date));

  return {
    success: true,
    totalDays: uniqueDates.size,
    avgTopicsPerDay:
      studySlotCount > 0 && uniqueDates.size > 0
        ? Math.round(studySlotCount / uniqueDates.size)
        : 0,
  };
}

export async function moveSlotAction(
  planId: string,
  input: MoveSlotInput
): Promise<{ success: boolean; message?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, message: "Not authenticated" };
  }

  const plan = await getPlanById(planId, session.user.id);
  if (!plan) {
    return { success: false, message: "Plan not found" };
  }

  if (input.targetDate < plan.startDate || input.targetDate > plan.deadline) {
    return { success: false, message: "Target date is outside the plan range" };
  }

  const slot = await db
    .select({ id: scheduleSlots.id })
    .from(scheduleSlots)
    .where(
      and(eq(scheduleSlots.id, input.slotId), eq(scheduleSlots.planId, planId))
    )
    .get();

  if (!slot) {
    return { success: false, message: "Slot not found in this plan" };
  }

  await db
    .update(scheduleSlots)
    .set({ date: input.targetDate })
    .where(eq(scheduleSlots.id, input.slotId));

  revalidatePath(`/plans/${planId}`);
  return { success: true };
}

export async function regenerateScheduleAction(
  planId: string
): Promise<GenerateResult> {
  return generateScheduleAction(planId);
}
