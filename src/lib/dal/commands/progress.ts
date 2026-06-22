/**
 * Progress tracking write operations.
 * 
 * TODO: Implement in Phase 5 (Study Sessions & Progress Tracking).
 */

export async function markTopicStudied(planId: string, topicId: string, userId: string): Promise<void> {
  // TODO: 
  // 1. Insert completion record
  // 2. Update schedule_slots.isCompleted
  // 3. Increment study_plans.completedTopics
  // 4. Trigger revision scheduling for 7d and 30d
  throw new Error("Not implemented — Phase 5");
}

export async function logStudySession(data: {
  userId: string;
  planId: string;
  topicId: string;
  durationMinutes: number;
}): Promise<void> {
  // TODO: Insert into study_sessions table
  throw new Error("Not implemented — Phase 5");
}
