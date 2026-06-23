import { cache } from "react";
import { db } from "@/lib/db/client";
import { subjects, topics } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

export type SubjectWithTopics = {
  id: string;
  name: string;
  color: string | null;
  difficulty: string | null;
  archivedAt: string | null;
  topics: Array<{
    id: string;
    title: string;
    estimatedHours: number | null;
    status: string;
    sortOrder: number;
  }>;
};

export type SubjectSummary = {
  id: string;
  name: string;
  color: string | null;
  difficulty: string | null;
  topicCount: number;
  archivedAt: string | null;
};

export const getSubjectsForUser = cache(async (userId: string): Promise<SubjectSummary[]> => {
  const rows = await db
    .select({
      id: subjects.id,
      name: subjects.name,
      color: subjects.color,
      difficulty: subjects.difficulty,
      archivedAt: subjects.archivedAt,
      topicCount: sql<number>`count(${topics.id})`,
    })
    .from(subjects)
    .leftJoin(topics, eq(topics.subjectId, subjects.id))
    .where(and(eq(subjects.userId, userId), isNull(subjects.archivedAt)))
    .groupBy(subjects.id)
    .orderBy(subjects.createdAt);

  return rows;
});

export const getSubjectById = cache(async (subjectId: string, userId: string): Promise<SubjectWithTopics | null> => {
  const subjectRow = await db
    .select()
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), eq(subjects.userId, userId), isNull(subjects.archivedAt)))
    .get();

  if (!subjectRow) return null;

  const topicRows = await db
    .select()
    .from(topics)
    .where(eq(topics.subjectId, subjectId))
    .orderBy(topics.sortOrder)
    .all();

  return {
    ...subjectRow,
    topics: topicRows.map((t) => ({
      id: t.id,
      title: t.title,
      estimatedHours: t.estimatedHours,
      status: t.status ?? "pending",
      sortOrder: t.sortOrder ?? 0,
    })),
  };
});
