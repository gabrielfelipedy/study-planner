/**
 * Schedule mutation operations (called by the scheduler engine).
 *
 * saveSchedule — replaces ALL existing slots for a plan (delete + bulk insert)
 * resetSchedule — removes all slots for a plan
 */

import { db } from "@/lib/db/client";
import { scheduleSlots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type SlotInput = {
  planId: string;
  topicId: string | null; // null for buffer/catch-up slots
  date: string;
  type: "study" | "buffer" | "catch-up";
  estimatedMinutes?: number;
};

/**
 * Save generated schedule slots. Replaces ALL existing slots for the plan.
 * This is called by the scheduler engine after distribution.
 */
export async function saveSchedule(
  planId: string,
  slots: SlotInput[]
): Promise<void> {
  await db.delete(scheduleSlots).where(eq(scheduleSlots.planId, planId));

  if (slots.length > 0) {
    await db.insert(scheduleSlots).values(
      slots.map((s) => ({
        id: crypto.randomUUID(),
        planId: s.planId,
        topicId: s.topicId,
        date: s.date,
        type: s.type,
        estimatedMinutes: s.estimatedMinutes ?? null,
      }))
    );
  }
}

/**
 * Reset a plan's schedule (delete all slots) — called before regeneration.
 */
export async function resetSchedule(planId: string): Promise<void> {
  await db.delete(scheduleSlots).where(eq(scheduleSlots.planId, planId));
}
