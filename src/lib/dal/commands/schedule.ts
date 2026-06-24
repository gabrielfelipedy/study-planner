/**
 * Schedule mutation operations (called by the scheduler engine).
 *
 * saveSchedule — replaces ALL existing slots for a plan (delete + bulk insert)
 * resetSchedule — removes all slots for a plan
 */

import { db } from "@/lib/db/client";
import { scheduleSlots, completions } from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

export type SlotInput = {
  planId: string;
  topicId: string | null;
  date: string;
  type: "study";
};

/**
 * Save generated schedule slots. Replaces ALL existing slots for the plan.
 * This is called by the scheduler engine after distribution.
 */
export async function saveSchedule(
  planId: string,
  slots: SlotInput[]
): Promise<void> {
  // Preserve revision slots — only delete study/buffer/catch-up
  await db
    .delete(scheduleSlots)
    .where(
      and(
        eq(scheduleSlots.planId, planId),
        sql`${scheduleSlots.type} NOT LIKE 'revision-%'`
      )
    );

  if (slots.length > 0) {
    await db.insert(scheduleSlots).values(
      slots.map((s) => ({
        id: crypto.randomUUID(),
        planId: s.planId,
        topicId: s.topicId,
        date: s.date,
        type: s.type,
      }))
    );
  }

  const completed = await db
    .select({ topicId: completions.topicId })
    .from(completions)
    .where(eq(completions.planId, planId))
    .all();

  if (completed.length > 0) {
    await db
      .update(scheduleSlots)
      .set({ isCompleted: true })
      .where(
        and(
          eq(scheduleSlots.planId, planId),
          inArray(scheduleSlots.topicId, completed.map((c) => c.topicId))
        )
      );
  }
}

/**
 * Reset a plan's schedule (delete all slots) — called before regeneration.
 */
export async function resetSchedule(planId: string): Promise<void> {
  await db.delete(scheduleSlots).where(eq(scheduleSlots.planId, planId));
}
