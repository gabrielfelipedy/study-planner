/**
 * Subject and topic write operations.
 * 
 * TODO: Implement in Phase 3 (Subject & Topic Management).
 */

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
  // TODO: db.insert(subjects).values({ id: crypto.randomUUID(), ...input })
  throw new Error("Not implemented — Phase 3");
}

export async function updateSubject(subjectId: string, userId: string, data: Partial<CreateSubjectInput>): Promise<void> {
  // TODO: db.update(subjects).set(data).where(and(eq(subjects.id, subjectId), eq(subjects.userId, userId)))
  throw new Error("Not implemented — Phase 3");
}

export async function deleteSubject(subjectId: string, userId: string): Promise<void> {
  // TODO: Cascade delete — topics → subject
  throw new Error("Not implemented — Phase 3");
}

export async function createTopic(input: CreateTopicInput): Promise<{ id: string }> {
  // TODO: db.insert(topics).values({ id: crypto.randomUUID(), ...input })
  throw new Error("Not implemented — Phase 3");
}

export async function updateTopic(topicId: string, data: Partial<CreateTopicInput>): Promise<void> {
  // TODO: db.update(topics).set(data).where(eq(topics.id, topicId))
  throw new Error("Not implemented — Phase 3");
}

export async function deleteTopic(topicId: string): Promise<void> {
  // TODO: db.delete(topics).where(eq(topics.id, topicId))
  throw new Error("Not implemented — Phase 3");
}
