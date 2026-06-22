/**
 * Plan write operations.
 * 
 * TODO: Implement in Phase 3-4 (when plan creation/timetable generation go live).
 * These functions are called by Server Actions after auth + validation.
 * They return typed results — errors thrown here will be caught by the action layer.
 */

export type CreatePlanInput = {
  userId: string;
  title: string;
  deadline: string;
  startDate: string;
  hoursPerDay?: number;
};

export type PlanResult = {
  id: string;
  title: string;
  deadline: string;
};

/**
 * Create a new study plan. Does NOT generate the timetable —
 * call generateSchedule separately after creation.
 */
export async function createPlan(input: CreatePlanInput): Promise<PlanResult> {
  // TODO: db.insert(studyPlans).values({ id: crypto.randomUUID(), ...input })
  throw new Error("Not implemented — Phase 4");
}

/**
 * Update a study plan's metadata (title, deadline, hoursPerDay).
 * Changing the deadline may trigger schedule regeneration.
 */
export async function updatePlan(planId: string, userId: string, data: Partial<CreatePlanInput>): Promise<PlanResult> {
  // TODO: db.update(studyPlans).set(data).where(and(eq(studyPlans.id, planId), eq(studyPlans.userId, userId)))
  throw new Error("Not implemented — Phase 4");
}

/**
 * Delete a study plan and all associated schedule slots and completions.
 */
export async function deletePlan(planId: string, userId: string): Promise<void> {
  // TODO: Cascade delete — completions → schedule_slots → plan_topics → study_plans
  throw new Error("Not implemented — Phase 4");
}
