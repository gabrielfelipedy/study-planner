import { cache } from "react";
import { db } from "@/lib/db/client";
import { revisions, scheduleSlots, topics, subjects } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export type RevisionState = {
  planId: string;
  topicId: string;
  stability: number;
  difficulty: number;
  retrievability: number;
  cardState: string;
  reps: number;
  lapses: number;
  lastReviewAt: string | null;
  nextReviewDate: string | null;
  isCompleted: boolean;
};

/**
 * Get the current (most recent) revision state for a topic in a plan.
 * Uses React.cache for deduplication within a single render pass.
 */
export const getCurrentRevisionState = cache(
  async (planId: string, topicId: string): Promise<RevisionState | null> => {
    const row = await db
      .select()
      .from(revisions)
      .where(and(eq(revisions.planId, planId), eq(revisions.topicId, topicId)))
      .orderBy(desc(revisions.createdAt))
      .get();

    if (!row) return null;

    return {
      planId: row.planId,
      topicId: row.topicId,
      stability: row.stability ?? 0,
      difficulty: row.difficulty ?? 0,
      retrievability: row.retrievability ?? 1.0,
      cardState: row.cardState ?? "new",
      reps: row.reps ?? 0,
      lapses: row.lapses ?? 0,
      lastReviewAt: row.lastReviewAt,
      nextReviewDate: row.scheduledDate,
      isCompleted: row.isCompleted ?? false,
    };
  }
);

/**
 * Get all pending (uncompleted) revision schedule_slots for a plan.
 * Returns topic title and subject color for UI rendering.
 */
export const getPendingRevisionSlots = cache(
  async (
    planId: string
  ): Promise<
    Array<{
      slotId: string;
      topicId: string;
      date: string;
      type: string;
      topicTitle: string;
      subjectColor: string | null;
    }>
  > => {
    const rows = await db
      .select({
        slotId: scheduleSlots.id,
        topicId: scheduleSlots.topicId,
        date: scheduleSlots.date,
        type: scheduleSlots.type,
        topicTitle: topics.title,
        subjectColor: subjects.color,
      })
      .from(scheduleSlots)
      .innerJoin(topics, eq(topics.id, scheduleSlots.topicId))
      .leftJoin(subjects, eq(subjects.id, topics.subjectId))
      .where(
        and(
          eq(scheduleSlots.planId, planId),
          sql`${scheduleSlots.type} LIKE 'revision-%'`,
          eq(scheduleSlots.isCompleted, false)
        )
      )
      .all();

    return rows.map((r) => ({
      slotId: r.slotId,
      topicId: r.topicId ?? "",
      date: r.date,
      type: r.type,
      topicTitle: r.topicTitle,
      subjectColor: r.subjectColor,
    }));
  }
);

/**
 * Get revision history for a topic in a plan (ordered newest first).
 */
export const getRevisionHistory = cache(async (planId: string, topicId: string) => {
  return db
    .select()
    .from(revisions)
    .where(and(eq(revisions.planId, planId), eq(revisions.topicId, topicId)))
    .orderBy(desc(revisions.createdAt))
    .all();
});
