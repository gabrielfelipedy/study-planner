/**
 * Revision scheduling engine using FSRS (Free Spaced Repetition Scheduler).
 * 
 * TODO: Implement in Phase 6 (Revision Scheduling).
 * Will use ts-fsrs library for interval calculations.
 * 
 * Design constraints from PITFALLS.md:
 * - Use proper FSRS (not fixed 7d/30d arithmetic)
 * - 4-button rating system (Again/Hard/Good/Easy)
 * - Store raw review events for future retraining
 * - Cap first-review interval at 14 days
 */

export type RevisionInput = {
  planId: string;
  topicId: string;
  studiedDate: string;
};

export type RevisionRating = "again" | "hard" | "good" | "easy";

/**
 * Schedule initial revision slots after a topic is marked as studied.
 * Creates 7d and 30d revision schedule_slots entries.
 */
export async function scheduleRevision(input: RevisionInput): Promise<void> {
  // TODO: Calculate intervals using ts-fsrs, create schedule_slots entries
  throw new Error("Not implemented — Phase 6");
}

/**
 * Process a review rating and reschedule the next revision.
 * Called when user responds to a revision with Again/Hard/Good/Easy.
 */
export async function processReviewRating(
  revisionId: string,
  rating: RevisionRating
): Promise<void> {
  // TODO: Update FSRS memory state, schedule next revision
  throw new Error("Not implemented — Phase 6");
}
