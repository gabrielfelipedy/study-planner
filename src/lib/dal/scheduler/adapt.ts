/**
 * Adaptive rescheduling — replans remaining topics based on actual progress.
 * 
 * TODO: Implement in Phase 7 (Adaptive Rescheduling).
 * 
 * Design constraints from PITFALLS.md:
 * - Preserve completed topics (never reschedule what's done)
 * - Redistribute pending + missed topics across remaining days
 * - Keep manual adjustments to future slots if possible
 * - Visible backlog trend (growing or shrinking)
 * - "Regenerate from today" button behavior
 */

export type AdaptInput = {
  planId: string;
  userId: string;
};

/**
 * Regenerate schedule from today based on actual vs planned progress.
 * Only affects pending topics — completed topics remain untouched.
 * Existing manual slot adjustments on future dates should be preserved.
 */
export async function adaptSchedule(input: AdaptInput): Promise<void> {
  // TODO:
  // 1. Query plan + current progress
  // 2. Identify pending topics (not completed, not past deadline)
  // 3. Identify missed topics (past day, not completed)
  // 4. Redistribute across remaining days
  // 5. Write updated schedule_slots (keeping existing future adjustments)
  throw new Error("Not implemented — Phase 7");
}

/**
 * Detect whether a plan needs adaptive rescheduling.
 * Returns true if the user is significantly behind schedule.
 */
export async function needsAdaptation(planId: string): Promise<boolean> {
  // TODO: Compare planned vs actual completions — flag if >20% behind
  return false;
}
