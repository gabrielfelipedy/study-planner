import { db } from "@/lib/db/client";
import { subjects, topics } from "@/lib/db/schema";
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
  estimatedHours?: number;
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
    estimatedHours: input.estimatedHours ?? null,
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
  data: { title?: string; estimatedHours?: number }
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

export async function deleteTopic(topicId: string): Promise<void> {
  const existing = await db.select().from(topics).where(eq(topics.id, topicId)).get();
  if (!existing) throw new Error("Topic not found");
  await db.delete(topics).where(eq(topics.id, topicId));
}

export async function deleteTopics(topicIds: string[]): Promise<void> {
  if (topicIds.length === 0) return;
  await db.delete(topics).where(inArray(topics.id, topicIds));
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
