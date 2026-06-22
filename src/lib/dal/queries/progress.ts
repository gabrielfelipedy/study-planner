/**
 * Progress and completion read operations.
 * 
 * TODO: Implement in Phase 5 (Study Sessions & Progress Tracking).
 */

import { cache } from "react";

export type CompletionStats = {
  planId: string;
  totalTopics: number;
  completedTopics: number;
  percentage: number;
};

/**
 * Get completion statistics for a study plan.
 */
export const getCompletionStats = cache(async (planId: string): Promise<CompletionStats> => {
  // TODO: Count completed vs total topics for plan
  return { planId, totalTopics: 0, completedTopics: 0, percentage: 0 };
});

/**
 * Get today's scheduled topics (study + revision).
 */
export const getTodaySchedule = cache(async (userId: string): Promise<any[]> => {
  // TODO: Query schedule_slots for current date
  return [];
});
