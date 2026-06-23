import { db } from "@/lib/db/client";
import { subjects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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

// ── Topic stubs (implemented in Plan 02) ──────────────────────

export async function createTopic(input: CreateTopicInput): Promise<{ id: string }> {
  throw new Error("Not implemented — Phase 3 Plan 02");
}

export async function updateTopic(topicId: string, data: Partial<CreateTopicInput>): Promise<void> {
  throw new Error("Not implemented — Phase 3 Plan 02");
}

export async function deleteTopic(topicId: string): Promise<void> {
  throw new Error("Not implemented — Phase 3 Plan 02");
}
