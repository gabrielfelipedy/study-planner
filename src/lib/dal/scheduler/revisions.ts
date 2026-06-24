/**
 * Simple revision scheduling.
 *
 * When a topic is marked as studied, schedules exactly 1 review slot
 * exactly 7 days later. Rating a review marks the slot completed and
 * updates topic status — no FSRS, no dynamic chains.
 */

import { db } from "@/lib/db/client";
import { revisions, scheduleSlots, topics } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { addDays, format } from "date-fns";

export type RevisionInput = {
  planId: string;
  topicId: string;
  studiedDate: string;
};

export type RevisionRating = "again" | "hard" | "good" | "easy";

/**
 * Schedule 1 review exactly 7 days after studied date.
 */
export async function scheduleRevision(input: RevisionInput): Promise<void> {
  const { planId, topicId, studiedDate } = input;

  const reviewDate = format(addDays(new Date(studiedDate), 7), "yyyy-MM-dd");

  await db.insert(revisions).values({
    id: crypto.randomUUID(),
    planId,
    topicId,
    originalStudyDate: studiedDate,
    scheduledDate: reviewDate,
  });

  await db.insert(scheduleSlots).values({
    id: crypto.randomUUID(),
    planId,
    topicId,
    date: reviewDate,
    type: "revision-7d",
    isCompleted: false,
  });
}

/**
 * Process a review rating — mark the pending revision slot completed
 * and update topic status to "revised".
 */
export async function processReviewRating(
  planId: string,
  topicId: string,
  rating: RevisionRating
): Promise<void> {
  const now = new Date().toISOString();

  const pendingSlot = await db
    .select({ id: scheduleSlots.id })
    .from(scheduleSlots)
    .where(
      and(
        eq(scheduleSlots.planId, planId),
        eq(scheduleSlots.topicId, topicId),
        eq(scheduleSlots.isCompleted, false)
      )
    )
    .get();

  if (!pendingSlot) return;

  await db
    .update(scheduleSlots)
    .set({ isCompleted: true, completedAt: now })
    .where(eq(scheduleSlots.id, pendingSlot.id));

  await db
    .update(topics)
    .set({ status: "revised" })
    .where(eq(topics.id, topicId));
}
