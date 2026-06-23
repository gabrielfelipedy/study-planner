import { db } from "@/lib/db/client";
import { studyPlans, planTopics, topics } from "@/lib/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

export type CreatePlanInput = {
  userId: string;
  title: string;
  deadline: string;
  startDate: string;
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
    hoursPerWeek?: number | null;
    studyDays?: string | null;
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

  await db
    .update(studyPlans)
    .set({ totalTopics: count?.total ?? 0, updatedAt: new Date().toISOString() })
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
  }

  const count = await db
    .select({ total: sql<number>`count(*)` })
    .from(planTopics)
    .where(eq(planTopics.planId, planId))
    .get();

  await db
    .update(studyPlans)
    .set({ totalTopics: count?.total ?? 0, updatedAt: new Date().toISOString() })
    .where(eq(studyPlans.id, planId));
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
