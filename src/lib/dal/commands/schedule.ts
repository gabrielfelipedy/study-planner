/**
 * Schedule mutation operations (called by the scheduler engine).
 * 
 * TODO: Implement in Phase 4 (Timetable Engine & Schedule View).
 */

export type SlotInput = {
  planId: string;
  topicId: string;
  date: string;
  type: "study" | "revision-7d" | "revision-30d";
  estimatedMinutes?: number;
};

/**
 * Save generated schedule slots. Replaces ALL existing slots for the plan.
 * This is called by the scheduler engine after distribution.
 */
export async function saveSchedule(planId: string, slots: SlotInput[]): Promise<void> {
  // TODO: 
  // 1. Delete existing slots for plan
  // 2. Bulk insert new slots
  throw new Error("Not implemented — Phase 4");
}

/**
 * Reset a plan's schedule (delete all slots) — called before regeneration.
 */
export async function resetSchedule(planId: string): Promise<void> {
  // TODO: db.delete(scheduleSlots).where(eq(scheduleSlots.planId, planId))
  throw new Error("Not implemented — Phase 4");
}
