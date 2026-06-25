"use server";

import { revalidatePath } from "next/cache";
import { inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { planTopics } from "@/lib/db/schema";
import {
  createSubject as dalCreateSubject,
  updateSubject as dalUpdateSubject,
  createTopics as dalCreateTopics,
  deleteTopics as dalDeleteTopics,
  reorderTopics as dalReorderTopics,
  updateTopic as dalUpdateTopic,
  deleteTopic as dalDeleteTopic,
} from "@/lib/dal/commands/subjects";
import type {
  CreateSubjectInput,
  CreateTopicInput,
} from "@/lib/dal/commands/subjects";

export async function createSubject(input: CreateSubjectInput) {
  return dalCreateSubject(input);
}

export async function updateSubject(
  subjectId: string,
  userId: string,
  data: { name?: string; color?: string }
) {
  return dalUpdateSubject(subjectId, userId, data);
}

export async function createTopics(subjectId: string, titles: string[]) {
  const { ids, planIds } = await dalCreateTopics(subjectId, titles);
  for (const planId of planIds) {
    revalidatePath(`/plans/${planId}`);
  }
  revalidatePath(`/subjects/[id]`, "page");
  return { ids };
}

export async function checkTopicsInPlans(
  topicIds: string[]
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(distinct ${planTopics.planId})` })
    .from(planTopics)
    .where(inArray(planTopics.topicId, topicIds))
    .get();
  return result?.count ?? 0;
}

export async function deleteTopics(topicIds: string[]) {
  const planIds = await dalDeleteTopics(topicIds);
  for (const planId of planIds) {
    revalidatePath(`/plans/${planId}`);
  }
  revalidatePath(`/subjects/[id]`, "page");
}

export async function reorderTopics(
  subjectId: string,
  orders: { id: string; sortOrder: number }[]
) {
  return dalReorderTopics(subjectId, orders);
}

export async function updateTopic(
  topicId: string,
  userId: string,
  data: { title?: string }
) {
  return dalUpdateTopic(topicId, userId, data);
}

export async function deleteTopic(topicId: string) {
  const planIds = await dalDeleteTopic(topicId);
  for (const planId of planIds) {
    revalidatePath(`/plans/${planId}`);
  }
}
