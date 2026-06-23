import { db } from "@/lib/db/client";
import { completions, topics, scheduleSlots, studyPlans } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { scheduleRevision } from "@/lib/dal/scheduler/revisions";

export async function markTopicStudied(planId: string, topicId: string, userId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  await db.transaction(async (tx) => {
    await tx.insert(completions).values({
      id: crypto.randomUUID(),
      userId,
      planId,
      topicId,
      date: today,
      createdAt: new Date().toISOString(),
    });

    await tx
      .update(topics)
      .set({ status: "studied" })
      .where(eq(topics.id, topicId));

    await tx
      .update(scheduleSlots)
      .set({
        isCompleted: true,
        completedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(scheduleSlots.planId, planId),
          eq(scheduleSlots.topicId, topicId)
        )
      );

    await tx
      .update(studyPlans)
      .set({ completedTopics: sql`completed_topics + 1` })
      .where(eq(studyPlans.id, planId));
  });

  // Schedule revision slots (non-blocking — don't fail if revision scheduling errors)
  try {
    await scheduleRevision({ planId, topicId, studiedDate: today });
  } catch (error) {
    console.error("Failed to schedule revision:", error);
    // Don't throw — topic was still marked as studied successfully
  }
}
