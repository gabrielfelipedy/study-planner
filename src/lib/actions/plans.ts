"use server";

import {
  createPlan as dalCreatePlan,
  updatePlan as dalUpdatePlan,
  addSubjectToPlan as dalAddSubjectToPlan,
  removeSubjectFromPlan as dalRemoveSubjectFromPlan,
  archivePlan as dalArchivePlan,
} from "@/lib/dal/commands/plans";
import type {
  CreatePlanInput,
  PlanResult,
} from "@/lib/dal/commands/plans";

export async function createPlan(input: CreatePlanInput): Promise<PlanResult> {
  return dalCreatePlan(input);
}

export async function updatePlan(
  planId: string,
  userId: string,
  data: {
    title?: string;
    deadline?: string;
    startDate?: string;
    hoursPerWeek?: number | null;
    studyDays?: string | null;
  }
): Promise<PlanResult | null> {
  return dalUpdatePlan(planId, userId, data);
}

export async function addSubjectToPlan(
  planId: string,
  subjectId: string,
  userId: string
): Promise<void> {
  return dalAddSubjectToPlan(planId, subjectId, userId);
}

export async function removeSubjectFromPlan(
  planId: string,
  subjectId: string,
  userId: string
): Promise<void> {
  return dalRemoveSubjectFromPlan(planId, subjectId, userId);
}

export async function archivePlan(planId: string, userId: string): Promise<void> {
  return dalArchivePlan(planId, userId);
}
