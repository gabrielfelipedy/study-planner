/**
 * Calendar and schedule read operations.
 * 
 * TODO: Implement in Phase 4 (Timetable Engine & Schedule View).
 */

import { cache } from "react";

export type ScheduleSlot = {
  id: string;
  planId: string;
  topicId: string;
  date: string;
  type: "study" | "revision-7d" | "revision-30d";
  estimatedMinutes: number | null;
  isCompleted: boolean;
  topicTitle?: string;
  subjectName?: string;
  subjectColor?: string;
};

/**
 * Get schedule slots for a plan within a date range.
 */
export const getScheduleSlots = cache(async (
  planId: string,
  startDate: string,
  endDate: string
): Promise<ScheduleSlot[]> => {
  // TODO: Query schedule_slots with topic + subject joins for display
  return [];
});
