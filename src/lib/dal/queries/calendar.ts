/**
 * Calendar and schedule read operations.
 *
 * getScheduleSlots — returns schedule slots with topic/subject data for display
 * Uses LEFT JOIN for topics and subjects (buffer/catch-up slots have null topicId)
 */

import { cache } from "react";
import { db } from "@/lib/db/client";
import { scheduleSlots, topics, subjects } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export type ScheduleSlot = {
  id: string;
  planId: string;
  topicId: string | null;
  date: string;
  type: "study" | "buffer" | "catch-up" | "revision-7d" | "revision-30d";
  estimatedMinutes: number | null;
  isCompleted: boolean;
  topicTitle: string | null;
  subjectName: string | null;
  subjectColor: string | null;
};

/**
 * Get schedule slots for a plan within a date range.
 * Uses LEFT JOIN so buffer/catch-up slots (with null topicId) are included.
 */
export const getScheduleSlots = cache(
  async (
    planId: string,
    startDate: string,
    endDate: string
  ): Promise<ScheduleSlot[]> => {
    const rows = await db
      .select({
        id: scheduleSlots.id,
        planId: scheduleSlots.planId,
        topicId: scheduleSlots.topicId,
        date: scheduleSlots.date,
        type: scheduleSlots.type,
        estimatedMinutes: scheduleSlots.estimatedMinutes,
        isCompleted: scheduleSlots.isCompleted,
        topicTitle: topics.title,
        subjectName: subjects.name,
        subjectColor: subjects.color,
      })
      .from(scheduleSlots)
      .leftJoin(topics, eq(topics.id, scheduleSlots.topicId))
      .leftJoin(subjects, eq(subjects.id, topics.subjectId))
      .where(
        and(
          eq(scheduleSlots.planId, planId),
          sql`${scheduleSlots.date} >= ${startDate}`,
          sql`${scheduleSlots.date} <= ${endDate}`
        )
      )
      .orderBy(scheduleSlots.date)
      .all();

    return rows.map((r) => ({
      id: r.id,
      planId: r.planId,
      topicId: r.topicId,
      date: r.date,
      type: r.type as ScheduleSlot["type"],
      estimatedMinutes: r.estimatedMinutes ?? 0,
      isCompleted: r.isCompleted ?? false,
      topicTitle: r.topicTitle ?? null,
      subjectName: r.subjectName ?? null,
      subjectColor: r.subjectColor ?? null,
    }));
  }
);
