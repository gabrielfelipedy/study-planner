/**
 * Revision scheduling engine using FSRS (Free Spaced Repetition Scheduler).
 *
 * Uses ts-fsrs library for interval calculations with 4-button rating system.
 * Memory state (stability, difficulty, retrievability) is stored append-only
 * on the revisions table per D-04 — each review creates a new row.
 *
 * Design constraints from PITFALLS.md:
 * - Use proper FSRS (not fixed 7d/30d arithmetic)
 * - 4-button rating system (Again/Hard/Good/Easy)
 * - Store raw review events for future retraining
 * - Cap first-review interval at 14 days
 */

import { createEmptyCard, fsrs, Rating, State } from "ts-fsrs";
import type { Card, Grade } from "ts-fsrs";
import { db } from "@/lib/db/client";
import { revisions, scheduleSlots, topics, studyPlans } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { addDays, format, differenceInDays } from "date-fns";

export type RevisionInput = {
  planId: string;
  topicId: string;
  studiedDate: string;
};

export type RevisionRating = "again" | "hard" | "good" | "easy";

const MAX_MINUTES_PER_DAY = 240; // matches distribute.ts
const REVIEW_ESTIMATED_MINUTES = 30;

/**
 * Schedule initial revision slots after a topic is marked as studied.
 * Creates 7d and 30d revision schedule_slots entries using FSRS population defaults.
 */
export async function scheduleRevision(input: RevisionInput): Promise<void> {
  const { planId, topicId, studiedDate } = input;

  // 1. Create empty FSRS card with population defaults (D-03)
  const card = createEmptyCard();

  // 2. Insert initial revision row with FSRS state
  const revisionId = crypto.randomUUID();
  await db.insert(revisions).values({
    id: revisionId,
    planId,
    topicId,
    originalStudyDate: studiedDate,
    scheduledDate: studiedDate,
    interval: 0,
    stability: card.stability,
    difficulty: card.difficulty,
    retrievability: 1.0,
    cardState: "new",
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    rating: null,
    isCompleted: false,
  });

  // 3. Schedule first revision: 7 days after studiedDate (capacity-aware)
  const firstRevisionDate = await findNearestAvailableDay(
    planId,
    addDays(new Date(studiedDate), 7)
  );
  await db.insert(scheduleSlots).values({
    id: crypto.randomUUID(),
    planId,
    topicId,
    date: format(firstRevisionDate, "yyyy-MM-dd"),
    type: "revision-7d",
    estimatedMinutes: REVIEW_ESTIMATED_MINUTES,
    isCompleted: false,
  });

  // 4. Schedule second revision: 30 days after studiedDate (capacity-aware)
  const secondRevisionDate = await findNearestAvailableDay(
    planId,
    addDays(new Date(studiedDate), 30)
  );
  await db.insert(scheduleSlots).values({
    id: crypto.randomUUID(),
    planId,
    topicId,
    date: format(secondRevisionDate, "yyyy-MM-dd"),
    type: "revision-30d",
    estimatedMinutes: REVIEW_ESTIMATED_MINUTES,
    isCompleted: false,
  });
}

/**
 * Process a review rating and reschedule the next revision.
 * Follows D-04 append-only pattern: inserts a new revision row with updated FSRS state,
 * marks the current schedule slot as completed, and creates the next revision slot.
 */
export async function processReviewRating(
  planId: string,
  topicId: string,
  rating: RevisionRating
): Promise<void> {
  // 1. Get current revision state (most recent row for this topic+plan)
  const currentRow = await db
    .select()
    .from(revisions)
    .where(and(eq(revisions.planId, planId), eq(revisions.topicId, topicId)))
    .orderBy(sql`${revisions.createdAt} DESC`)
    .get();

  if (!currentRow) {
    throw new Error("No revision found for this topic in this plan");
  }

  // 2. Build a ts-fsrs Card from stored state
  const now = new Date();
  const card: Card = {
    due: new Date(currentRow.scheduledDate),
    stability: currentRow.stability ?? 0,
    difficulty: currentRow.difficulty ?? 0,
    elapsed_days: currentRow.elapsedDays ?? differenceInDays(now, new Date(currentRow.scheduledDate)),
    scheduled_days: currentRow.scheduledDays ?? 0,
    reps: currentRow.reps ?? 0,
    lapses: currentRow.lapses ?? 0,
    learning_steps: 0,
    state: mapCardState(currentRow.cardState ?? "new"),
    last_review: currentRow.lastReviewAt ? new Date(currentRow.lastReviewAt) : undefined,
  };

  // 3. Initialize FSRS scheduler and compute next state
  const scheduler = fsrs();
  const result = scheduler.next(card, now, mapRating(rating));
  const updatedCard = result.card;
  const reviewLog = result.log;

  // 4. Cap the first review's scheduled_days at 14 (per PITFALLS.md Recovery Strategies)
  let scheduledDays = updatedCard.scheduled_days;
  if (card.reps === 0 && scheduledDays > 14) {
    scheduledDays = 14;
  }

  // 5. Compute retrievability for the updated card at the current time
  const R = scheduler.get_retrievability(updatedCard, now, false);

  // 6. Insert NEW revision row with updated FSRS state (append-only per D-04)
  const newRevisionId = crypto.randomUUID();
  await db.insert(revisions).values({
    id: newRevisionId,
    planId,
    topicId,
    originalStudyDate: currentRow.originalStudyDate,
    scheduledDate: format(now, "yyyy-MM-dd"),
    interval: scheduledDays,
    stability: updatedCard.stability,
    difficulty: updatedCard.difficulty,
    retrievability: R,
    cardState: mapStateToString(updatedCard.state),
    elapsedDays: updatedCard.elapsed_days,
    scheduledDays,
    reps: updatedCard.reps,
    lapses: updatedCard.lapses,
    rating,
    isCompleted: true,
    completedAt: now.toISOString(),
    lastReviewAt: now.toISOString(),
  });

  // 7. Mark the existing pending revision schedule_slot as completed
  await db
    .update(scheduleSlots)
    .set({
      isCompleted: true,
      completedAt: now.toISOString(),
    })
    .where(
      and(
        eq(scheduleSlots.planId, planId),
        eq(scheduleSlots.topicId, topicId),
        sql`${scheduleSlots.type} LIKE 'revision-%'`,
        eq(scheduleSlots.isCompleted, false)
      )
    );

  // 8. Calculate the next review date (capacity-aware)
  const nextDate = await findNearestAvailableDay(
    planId,
    addDays(now, scheduledDays)
  );

  // 9. Insert a new schedule_slot for the next revision
  await db.insert(scheduleSlots).values({
    id: crypto.randomUUID(),
    planId,
    topicId,
    date: format(nextDate, "yyyy-MM-dd"),
    type: "revision-7d",
    estimatedMinutes: REVIEW_ESTIMATED_MINUTES,
    isCompleted: false,
  });

  // 10. Update topic status to "revised" if this is the first completed revision
  const existingRevisionCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(revisions)
    .where(
      and(
        eq(revisions.planId, planId),
        eq(revisions.topicId, topicId),
        eq(revisions.isCompleted, true)
      )
    )
    .get();

  if (existingRevisionCount && existingRevisionCount.count === 1) {
    // First completed revision — mark topic as revised
    await db
      .update(topics)
      .set({ status: "revised" })
      .where(eq(topics.id, topicId));
  }
}

/**
 * Find the nearest available study day for a revision slot respecting daily capacity limits.
 * Per D-08: prefers slightly-later dates over slightly-earlier dates.
 *
 * Checks plan studyDays and existing schedule_slots capacity for the preferred date.
 * If the preferred date is at capacity, iterates forward day-by-day to find the next
 * available study day within the plan's date range.
 */
async function findNearestAvailableDay(
  planId: string,
  preferredDate: Date
): Promise<Date> {
  // Get plan details
  const plan = await db
    .select({
      startDate: studyPlans.startDate,
      deadline: studyPlans.deadline,
      studyDays: studyPlans.studyDays,
    })
    .from(studyPlans)
    .where(eq(studyPlans.id, planId))
    .get();

  if (!plan || !plan.studyDays) {
    // Fallback: return the preferred date as-is
    return preferredDate;
  }

  const studyDaysArray = plan.studyDays
    .split(",")
    .map(Number)
    .filter((d) => !isNaN(d));
  const startDate = new Date(plan.startDate);
  const deadline = new Date(plan.deadline);

  // If preferredDate is before plan start, start from plan start
  let candidate = preferredDate < startDate ? startDate : preferredDate;

  // Iterate forward to find nearest available study day with capacity
  // Max 365 iterations to avoid infinite loop (safety limit)
  for (let i = 0; i < 365; i++) {
    // Check if candidate is within plan bounds
    if (candidate > deadline) {
      // If beyond deadline, fall back to preferred date (no capacity check)
      return preferredDate;
    }

    // Check if candidate is a study day
    if (!studyDaysArray.includes(candidate.getDay())) {
      candidate = addDays(candidate, 1);
      continue;
    }

    // Check daily capacity
    const dateStr = format(candidate, "yyyy-MM-dd");
    const existingMinutes = await db
      .select({
        total: sql<number>`coalesce(sum(${scheduleSlots.estimatedMinutes}), 0)`,
      })
      .from(scheduleSlots)
      .where(
        and(
          eq(scheduleSlots.planId, planId),
          eq(scheduleSlots.date, dateStr)
        )
      )
      .get();

    const usedMinutes = existingMinutes?.total ?? 0;
    if (usedMinutes + REVIEW_ESTIMATED_MINUTES <= MAX_MINUTES_PER_DAY) {
      return candidate;
    }

    // Day at capacity, try next day
    candidate = addDays(candidate, 1);
  }

  // Safety fallback: return the preferred date
  return preferredDate;
}

// ── Mapping helpers ──────────────────────────────

/**
 * Map stored card state string to ts-fsrs State enum.
 */
function mapCardState(state: string): State {
  const states: Record<string, State> = {
    new: State.New,
    learning: State.Learning,
    review: State.Review,
    relearning: State.Relearning,
  };
  return states[state] ?? State.New;
}

/**
 * Map RevisionRating string to ts-fsrs Rating enum.
 */
function mapRating(rating: RevisionRating): Grade {
  const ratings: Record<RevisionRating, Grade> = {
    again: Rating.Again as Grade,
    hard: Rating.Hard as Grade,
    good: Rating.Good as Grade,
    easy: Rating.Easy as Grade,
  };
  return ratings[rating];
}

/**
 * Map ts-fsrs State enum to string for storage.
 */
function mapStateToString(state: State): string {
  const states: Record<State, string> = {
    [State.New]: "new",
    [State.Learning]: "learning",
    [State.Review]: "review",
    [State.Relearning]: "relearning",
  };
  return states[state] ?? "new";
}
