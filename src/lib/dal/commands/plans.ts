import { db } from "@/lib/db/client";
import { studyPlans, planTopics, topics, completions, scheduleSlots, revisions } from "@/lib/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { format, eachDayOfInterval, parseISO } from "date-fns";

function isoDay(jsDay: number): number {
  return ((jsDay + 6) % 7) + 1;
}

export type CreatePlanInput = {
  userId: string;
  title: string;
  deadline: string;
  startDate: string;
  weekdays?: string; // ISO: "1,2,3,4,5" for Mon-Fri
  subjectIds: string[];
};

export type PlanResult = {
  id: string;
  title: string;
  deadline: string;
};

export async function createPlan(input: CreatePlanInput): Promise<PlanResult> {
  const id = crypto.randomUUID();

  const topicRows = await db
    .select({ id: topics.id })
    .from(topics)
    .where(inArray(topics.subjectId, input.subjectIds))
    .all();

  await db.insert(studyPlans).values({
    id,
    userId: input.userId,
    title: input.title,
    deadline: input.deadline,
    startDate: input.startDate,
    weekdays: input.weekdays ?? "1,2,3,4,5",
    totalTopics: topicRows.length,
  });

  if (topicRows.length > 0) {
    await db.insert(planTopics).values(
      topicRows.map((t, i) => ({
        id: crypto.randomUUID(),
        planId: id,
        topicId: t.id,
        sortOrder: i + 1,
      }))
    );
  }

  return { id, title: input.title, deadline: input.deadline };
}

export async function updatePlan(
  planId: string,
  userId: string,
  data: {
    title?: string;
    deadline?: string;
    startDate?: string;
    weekdays?: string;
  }
): Promise<PlanResult | null> {
  const existing = await db
    .select({ id: studyPlans.id })
    .from(studyPlans)
    .where(and(eq(studyPlans.id, planId), eq(studyPlans.userId, userId)))
    .get();

  if (!existing) return null;

  await db
    .update(studyPlans)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(and(eq(studyPlans.id, planId), eq(studyPlans.userId, userId)));

  const updated = await db
    .select({ id: studyPlans.id, title: studyPlans.title, deadline: studyPlans.deadline })
    .from(studyPlans)
    .where(eq(studyPlans.id, planId))
    .get();

  return updated ?? null;
}

export async function addSubjectToPlan(
  planId: string,
  subjectId: string,
  userId: string
): Promise<void> {
  const plan = await db
    .select({ id: studyPlans.id })
    .from(studyPlans)
    .where(and(eq(studyPlans.id, planId), eq(studyPlans.userId, userId)))
    .get();
  if (!plan) throw new Error("Plan not found");

  const existingTopicIds = await db
    .select({ topicId: planTopics.topicId })
    .from(planTopics)
    .where(eq(planTopics.planId, planId))
    .all();
  const existingSet = new Set(existingTopicIds.map((r) => r.topicId));

  const newTopics = await db
    .select({ id: topics.id })
    .from(topics)
    .where(and(eq(topics.subjectId, subjectId)))
    .all();

  const toInsert = newTopics
    .filter((t) => !existingSet.has(t.id))
    .map((t, i) => ({
      id: crypto.randomUUID(),
      planId,
      topicId: t.id,
      sortOrder: i + 1,
    }));

  if (toInsert.length === 0) return;

  await db.insert(planTopics).values(toInsert);

  const count = await db
    .select({ total: sql<number>`count(*)` })
    .from(planTopics)
    .where(eq(planTopics.planId, planId))
    .get();

  const completedCount = await db
    .select({ total: sql<number>`count(*)` })
    .from(planTopics)
    .innerJoin(
      completions,
      and(
        eq(completions.planId, planTopics.planId),
        eq(completions.topicId, planTopics.topicId)
      )
    )
    .where(eq(planTopics.planId, planId))
    .get();

  await db
    .update(studyPlans)
    .set({
      totalTopics: count?.total ?? 0,
      completedTopics: completedCount?.total ?? 0,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(studyPlans.id, planId));
}

export async function removeSubjectFromPlan(
  planId: string,
  subjectId: string,
  userId: string
): Promise<void> {
  const plan = await db
    .select({ id: studyPlans.id })
    .from(studyPlans)
    .where(and(eq(studyPlans.id, planId), eq(studyPlans.userId, userId)))
    .get();
  if (!plan) throw new Error("Plan not found");

  const topicRows = await db
    .select({ id: topics.id })
    .from(topics)
    .where(eq(topics.subjectId, subjectId))
    .all();
  const topicIds = topicRows.map((t) => t.id);

  if (topicIds.length > 0) {
    await db
      .delete(planTopics)
      .where(
        and(eq(planTopics.planId, planId), inArray(planTopics.topicId, topicIds))
      );

    await db
      .delete(completions)
      .where(
        and(eq(completions.planId, planId), inArray(completions.topicId, topicIds))
      );

    await db
      .delete(scheduleSlots)
      .where(
        and(eq(scheduleSlots.planId, planId), inArray(scheduleSlots.topicId, topicIds))
      );

    await db
      .delete(revisions)
      .where(
        and(eq(revisions.planId, planId), inArray(revisions.topicId, topicIds))
      );
  }

  const count = await db
    .select({ total: sql<number>`count(*)` })
    .from(planTopics)
    .where(eq(planTopics.planId, planId))
    .get();

  const completedCount = await db
    .select({ total: sql<number>`count(*)` })
    .from(planTopics)
    .innerJoin(
      completions,
      and(
        eq(completions.planId, planTopics.planId),
        eq(completions.topicId, planTopics.topicId)
      )
    )
    .where(eq(planTopics.planId, planId))
    .get();

  await db
    .update(studyPlans)
    .set({
      totalTopics: count?.total ?? 0,
      completedTopics: completedCount?.total ?? 0,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(studyPlans.id, planId));
}

export async function syncSubjectTopicsInPlan(
  planId: string,
  subjectId: string,
  userId: string
): Promise<{ addedTopicIds: string[] }> {
  const plan = await db
    .select({ id: studyPlans.id })
    .from(studyPlans)
    .where(and(eq(studyPlans.id, planId), eq(studyPlans.userId, userId)))
    .get();
  if (!plan) throw new Error("Plan not found");

  const currentTopics = await db
    .select({ id: topics.id })
    .from(topics)
    .where(eq(topics.subjectId, subjectId))
    .all();
  const currentIds = new Set(currentTopics.map((t) => t.id));

  const existingPlanTopics = await db
    .select({ id: planTopics.id, topicId: planTopics.topicId })
    .from(planTopics)
    .innerJoin(topics, eq(topics.id, planTopics.topicId))
    .where(and(eq(planTopics.planId, planId), eq(topics.subjectId, subjectId)))
    .all();
  const existingIds = new Set(existingPlanTopics.map((t) => t.topicId));

  const toAdd = currentTopics.filter((t) => !existingIds.has(t.id));
  const addedTopicIds = toAdd.map((t) => t.id);
  const toRemove = existingPlanTopics.filter((pt) => !currentIds.has(pt.topicId));

  if (toRemove.length > 0) {
    const removeTopicIds = toRemove.map((r) => r.topicId);
    const removePlanTopicIds = toRemove.map((r) => r.id);

    await db
      .delete(scheduleSlots)
      .where(
        and(eq(scheduleSlots.planId, planId), inArray(scheduleSlots.topicId, removeTopicIds))
      );
    await db
      .delete(completions)
      .where(
        and(eq(completions.planId, planId), inArray(completions.topicId, removeTopicIds))
      );
    await db
      .delete(revisions)
      .where(
        and(eq(revisions.planId, planId), inArray(revisions.topicId, removeTopicIds))
      );
    await db.delete(planTopics).where(inArray(planTopics.id, removePlanTopicIds));
  }

  if (toAdd.length > 0) {
    await db.insert(planTopics).values(
      toAdd.map((t, i) => ({
        id: crypto.randomUUID(),
        planId,
        topicId: t.id,
        sortOrder: i + 1,
      }))
    );
  }

  if (toAdd.length === 0 && toRemove.length === 0) return { addedTopicIds: [] };

  const count = await db
    .select({ total: sql<number>`count(*)` })
    .from(planTopics)
    .where(eq(planTopics.planId, planId))
    .get();

  const completedCount = await db
    .select({ total: sql<number>`count(*)` })
    .from(planTopics)
    .innerJoin(
      completions,
      and(
        eq(completions.planId, planTopics.planId),
        eq(completions.topicId, planTopics.topicId)
      )
    )
    .where(eq(planTopics.planId, planId))
    .get();

  await db
    .update(studyPlans)
    .set({
      totalTopics: count?.total ?? 0,
      completedTopics: completedCount?.total ?? 0,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(studyPlans.id, planId));

  return { addedTopicIds };
}

export async function insertTopicsIntoSchedule(
  planId: string,
  topicIds: string[]
): Promise<void> {
  if (topicIds.length === 0) return;

  const plan = await db
    .select({
      startDate: studyPlans.startDate,
      deadline: studyPlans.deadline,
      weekdays: studyPlans.weekdays,
    })
    .from(studyPlans)
    .where(eq(studyPlans.id, planId))
    .get();

  if (!plan) return;

  const allDays = eachDayOfInterval({
    start: parseISO(plan.startDate),
    end: parseISO(plan.deadline),
  });

  const selectedWeekdays = plan.weekdays
    ? new Set(plan.weekdays.split(",").map(Number))
    : new Set([1, 2, 3, 4, 5, 6, 7]);

  const studyDays = allDays.filter((d) => selectedWeekdays.has(isoDay(d.getDay())));

  const today = format(new Date(), "yyyy-MM-dd");
  const remainingDays = studyDays.filter((d) => format(d, "yyyy-MM-dd") >= today);

  if (remainingDays.length === 0) return;

  const existingSlots = await db
    .select({ date: scheduleSlots.date })
    .from(scheduleSlots)
    .where(and(eq(scheduleSlots.planId, planId), eq(scheduleSlots.type, "study")))
    .all();

  const slotCountByDate = new Map<string, number>();
  for (const slot of existingSlots) {
    slotCountByDate.set(slot.date, (slotCountByDate.get(slot.date) ?? 0) + 1);
  }

  const daySlots = remainingDays.map((d) => ({
    date: format(d, "yyyy-MM-dd"),
    count: slotCountByDate.get(format(d, "yyyy-MM-dd")) ?? 0,
  }));

  const values: Array<{
    id: string;
    planId: string;
    topicId: string;
    date: string;
    type: "study";
    isCompleted: boolean;
    isManual: boolean;
  }> = [];

  for (const topicId of topicIds) {
    daySlots.sort((a, b) => a.count - b.count || a.date.localeCompare(b.date));
    daySlots[0].count++;
    values.push({
      id: crypto.randomUUID(),
      planId,
      topicId,
      date: daySlots[0].date,
      type: "study" as const,
      isCompleted: false,
      isManual: false,
    });
  }

  await db.insert(scheduleSlots).values(values);
}

export async function archivePlan(planId: string, userId: string): Promise<void> {
  await db
    .update(studyPlans)
    .set({
      status: "archived",
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(studyPlans.id, planId), eq(studyPlans.userId, userId)));
}
