import { db } from "@/lib/db/client";
import { subjects, topics, scheduleSlots, planTopics, studyPlans } from "@/lib/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

export type CreateSubjectInput = {
  userId: string;
  name: string;
  color?: string;
  difficulty?: "easy" | "medium" | "hard";
};

export type CreateTopicInput = {
  subjectId: string;
  title: string;
};

export async function createSubject(input: CreateSubjectInput): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  await db.insert(subjects).values({
    id,
    userId: input.userId,
    name: input.name,
    color: input.color ?? null,
    difficulty: input.difficulty ?? null,
  });
  return { id };
}

export async function updateSubject(
  subjectId: string,
  userId: string,
  data: { name?: string; color?: string }
): Promise<void> {
  await db
    .update(subjects)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(and(eq(subjects.id, subjectId), eq(subjects.userId, userId)));
}

export async function archiveSubject(subjectId: string, userId: string): Promise<void> {
  const topicRows = await db
    .select({ id: topics.id })
    .from(topics)
    .where(eq(topics.subjectId, subjectId))
    .all();
  const topicIds = topicRows.map((t) => t.id);

  if (topicIds.length > 0) {
    const affectedPlans = await db
      .select({ planId: planTopics.planId })
      .from(planTopics)
      .where(inArray(planTopics.topicId, topicIds))
      .all();
    const planIds = [...new Set(affectedPlans.map((r) => r.planId))];

    await db.delete(scheduleSlots).where(inArray(scheduleSlots.topicId, topicIds));
    await db.delete(planTopics).where(inArray(planTopics.topicId, topicIds));

    for (const planId of planIds) {
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
  }

  await db
    .update(subjects)
    .set({ archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(and(eq(subjects.id, subjectId), eq(subjects.userId, userId)));
}

// ── Topic Operations ──────────────────────────────

export async function createTopic(input: CreateTopicInput): Promise<{ id: string }> {
  const maxOrder = await db
    .select({ max: sql<number>`max(${topics.sortOrder})` })
    .from(topics)
    .where(eq(topics.subjectId, input.subjectId))
    .get();

  const id = crypto.randomUUID();
  await db.insert(topics).values({
    id,
    subjectId: input.subjectId,
    title: input.title,
    sortOrder: (maxOrder?.max ?? 0) + 1,
  });
  return { id };
}

export async function createTopics(
  subjectId: string,
  titles: string[]
): Promise<{ ids: string[] }> {
  if (titles.length === 0) return { ids: [] };

  const maxOrder = await db
    .select({ max: sql<number>`max(${topics.sortOrder})` })
    .from(topics)
    .where(eq(topics.subjectId, subjectId))
    .get();

  const startOrder = (maxOrder?.max ?? 0) + 1;
  const values = titles.map((title, i) => ({
    id: crypto.randomUUID(),
    subjectId,
    title: title.trim(),
    sortOrder: startOrder + i,
  }));

  await db.insert(topics).values(values);
  return { ids: values.map((v) => v.id) };
}

export async function updateTopic(
  topicId: string,
  userId: string,
  data: { title?: string }
): Promise<void> {
  const topic = await db
    .select({ subjectId: topics.subjectId })
    .from(topics)
    .where(eq(topics.id, topicId))
    .get();

  if (!topic) throw new Error("Topic not found");

  const subject = await db
    .select({ userId: subjects.userId })
    .from(subjects)
    .where(and(eq(subjects.id, topic.subjectId), eq(subjects.userId, userId)))
    .get();

  if (!subject) throw new Error("Topic not found or access denied");

  await db
    .update(topics)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(topics.id, topicId));
}

export async function deleteTopic(topicId: string): Promise<string[]> {
  const existing = await db.select().from(topics).where(eq(topics.id, topicId)).get();
  if (!existing) throw new Error("Topic not found");

  const affectedPlans = await db
    .select({ planId: planTopics.planId })
    .from(planTopics)
    .where(eq(planTopics.topicId, topicId))
    .all();
  const planIds = [...new Set(affectedPlans.map((r) => r.planId))];

  await db.delete(scheduleSlots).where(eq(scheduleSlots.topicId, topicId));
  await db.delete(planTopics).where(eq(planTopics.topicId, topicId));
  await db.delete(topics).where(eq(topics.id, topicId));

  return planIds;
}

export async function deleteTopics(topicIds: string[]): Promise<string[]> {
  if (topicIds.length === 0) return [];

  const affectedPlans = await db
    .select({ planId: planTopics.planId })
    .from(planTopics)
    .where(inArray(planTopics.topicId, topicIds))
    .all();
  const planIds = [...new Set(affectedPlans.map((r) => r.planId))];

  await db.delete(scheduleSlots).where(inArray(scheduleSlots.topicId, topicIds));
  await db.delete(planTopics).where(inArray(planTopics.topicId, topicIds));
  await db.delete(topics).where(inArray(topics.id, topicIds));

  for (const planId of planIds) {
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

  return planIds;
}

export async function reorderTopics(
  subjectId: string,
  orders: { id: string; sortOrder: number }[]
): Promise<void> {
  for (const item of orders) {
    await db
      .update(topics)
      .set({ sortOrder: item.sortOrder, updatedAt: new Date().toISOString() })
      .where(and(eq(topics.id, item.id), eq(topics.subjectId, subjectId)));
  }
}
