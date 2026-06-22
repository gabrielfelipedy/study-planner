/**
 * Subject and topic read operations.
 * 
 * TODO: Implement in Phase 3 (Subject & Topic Management).
 */

import { cache } from "react";

export type SubjectWithTopics = {
  id: string;
  name: string;
  color: string | null;
  difficulty: string | null;
  topics: Array<{
    id: string;
    title: string;
    estimatedHours: number | null;
    status: string;
    sortOrder: number;
  }>;
};

/**
 * Get all subjects for a user, each with their nested topics.
 */
export const getSubjectsWithTopics = cache(async (userId: string): Promise<SubjectWithTopics[]> => {
  // TODO: db.select().from(subjects).leftJoin(topics, ...).where(eq(subjects.userId, userId))
  return [];
});

/**
 * Get a single subject by ID.
 */
export const getSubjectById = cache(async (subjectId: string, userId: string): Promise<SubjectWithTopics | null> => {
  // TODO: Single subject query with nested topics
  return null;
});
