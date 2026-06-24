import { cache } from "react";
import { db } from "@/lib/db/client";
import { studyPlans, scheduleSlots, topics, subjects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export type CompletionStats = {
  planId: string;
  totalTopics: number;
  completedTopics: number;
  percentage: number;
};

export type TodayTopic = {
  planId: string;
  planTitle: string;
  slotId: string;
  topicId: string;
  topicTitle: string;
  subjectName: string;
  subjectColor: string | null;
  isCompleted: boolean;
};

export const getCompletionStats = cache(async (planId: string): Promise<CompletionStats> => {
  const plan = await db
    .select({
      totalTopics: studyPlans.totalTopics,
      completedTopics: studyPlans.completedTopics,
    })
    .from(studyPlans)
    .where(eq(studyPlans.id, planId))
    .get();

  if (!plan) {
    return { planId, totalTopics: 0, completedTopics: 0, percentage: 0 };
  }

  const total = plan.totalTopics ?? 0;
  const completed = plan.completedTopics ?? 0;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { planId, totalTopics: total, completedTopics: completed, percentage };
});

export const getTodaySchedule = cache(async (userId: string): Promise<TodayTopic[]> => {
  const today = new Date().toISOString().split("T")[0];

  const rows = await db
    .select({
      planId: scheduleSlots.planId,
      planTitle: studyPlans.title,
      slotId: scheduleSlots.id,
      topicId: scheduleSlots.topicId,
      topicTitle: topics.title,
      subjectName: subjects.name,
      subjectColor: subjects.color,
      isCompleted: scheduleSlots.isCompleted,
    })
    .from(scheduleSlots)
    .innerJoin(studyPlans, eq(studyPlans.id, scheduleSlots.planId))
    .innerJoin(topics, eq(topics.id, scheduleSlots.topicId))
    .leftJoin(subjects, eq(subjects.id, topics.subjectId))
    .where(
      and(
        eq(scheduleSlots.date, today),
        eq(scheduleSlots.type, "study"),
        eq(studyPlans.userId, userId),
      )
    )
    .all();

  return rows.map((r) => ({
    planId: r.planId,
    planTitle: r.planTitle,
    slotId: r.slotId,
    topicId: r.topicId ?? "",
    topicTitle: r.topicTitle,
    subjectName: r.subjectName ?? "",
    subjectColor: r.subjectColor,
    isCompleted: r.isCompleted ?? false,
  }));
});
