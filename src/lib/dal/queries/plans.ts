import { cache } from "react";
import { db } from "@/lib/db/client";
import { studyPlans, planTopics, subjects, topics } from "@/lib/db/schema";
import { eq, and, isNull, sql, inArray } from "drizzle-orm";

export type PlanSummary = {
  id: string;
  title: string;
  deadline: string;
  status: string | null;
  totalTopics: number | null;
  completedTopics: number | null;
  subjects: Array<{
    name: string;
    color: string | null;
  }>;
};

export type PlanWithSubjects = Omit<PlanSummary, 'subjects'> & {
  startDate: string;
  weekdays: string;
  createdAt: string;
  archivedAt: string | null;
  totalTopics: number;
  completedTopics: number;
  lastScheduleGeneratedAt: string | null;
  lastScheduleStartDate: string | null;
  lastScheduleDeadline: string | null;
  subjects: Array<{
    id: string;
    name: string;
    color: string | null;
    topicCount: number;
  }>;
};

export const getPlansForUser = cache(async (userId: string): Promise<PlanSummary[]> => {
  const plans = await db
    .select({
      id: studyPlans.id,
      title: studyPlans.title,
      deadline: studyPlans.deadline,
      status: studyPlans.status,
      totalTopics: studyPlans.totalTopics,
      completedTopics: studyPlans.completedTopics,
    })
    .from(studyPlans)
    .where(
      and(
        eq(studyPlans.userId, userId),
        isNull(studyPlans.archivedAt)
      )
    )
    .orderBy(studyPlans.createdAt)
    .all();

  if (plans.length === 0) return [];

  const planSubjects = await db
    .select({
      planId: planTopics.planId,
      name: subjects.name,
      color: subjects.color,
    })
    .from(planTopics)
    .innerJoin(topics, eq(topics.id, planTopics.topicId))
    .innerJoin(subjects, eq(subjects.id, topics.subjectId))
    .where(inArray(planTopics.planId, plans.map((p) => p.id)))
    .all();

  const grouped = new Map<string, Map<string, { name: string; color: string | null }>>();
  for (const row of planSubjects) {
    let subjectsForPlan = grouped.get(row.planId);
    if (!subjectsForPlan) {
      subjectsForPlan = new Map();
      grouped.set(row.planId, subjectsForPlan);
    }
    if (!subjectsForPlan.has(row.name)) {
      subjectsForPlan.set(row.name, { name: row.name, color: row.color });
    }
  }

  return plans.map((plan) => ({
    ...plan,
    subjects: Array.from(grouped.get(plan.id)?.values() ?? []),
  }));
});

export const getPlanById = cache(async (planId: string, userId: string): Promise<PlanWithSubjects | null> => {
  const plan = await db
    .select()
    .from(studyPlans)
    .where(
      and(
        eq(studyPlans.id, planId),
        eq(studyPlans.userId, userId),
        isNull(studyPlans.archivedAt)
      )
    )
    .get();

  if (!plan) return null;

  const linkedSubjects = await db
    .select({
      id: subjects.id,
      name: subjects.name,
      color: subjects.color,
      topicCount: sql<number>`count(distinct ${topics.id})`,
    })
    .from(planTopics)
    .innerJoin(topics, eq(topics.id, planTopics.topicId))
    .innerJoin(subjects, eq(subjects.id, topics.subjectId))
    .where(eq(planTopics.planId, planId))
    .groupBy(subjects.id)
    .all();

  return {
    id: plan.id,
    title: plan.title,
    deadline: plan.deadline,
    status: plan.status,
    totalTopics: plan.totalTopics ?? 0,
    completedTopics: plan.completedTopics ?? 0,
    startDate: plan.startDate,
    weekdays: plan.weekdays ?? "1,2,3,4,5",
    createdAt: plan.createdAt,
    archivedAt: plan.archivedAt,
    lastScheduleGeneratedAt: plan.lastScheduleGeneratedAt,
    lastScheduleStartDate: plan.lastScheduleStartDate,
    lastScheduleDeadline: plan.lastScheduleDeadline,
    subjects: linkedSubjects,
  };
});

export const getPlanForEdit = cache(async (planId: string, userId: string) => {
  const plan = await db
    .select({
      id: studyPlans.id,
      title: studyPlans.title,
      deadline: studyPlans.deadline,
      startDate: studyPlans.startDate,
      weekdays: studyPlans.weekdays,
      status: studyPlans.status,
    })
    .from(studyPlans)
    .where(and(eq(studyPlans.id, planId), eq(studyPlans.userId, userId)))
    .get();

  if (!plan) return null;

  const subjectRows = await db
    .select({ subjectId: topics.subjectId })
    .from(planTopics)
    .innerJoin(topics, eq(topics.id, planTopics.topicId))
    .where(eq(planTopics.planId, planId))
    .all();

  const subjectIds = [...new Set(subjectRows.map((r) => r.subjectId))];

  return { ...plan, subjectIds };
});

export type TopicForScheduler = {
  id: string;
  title: string;
};

export const getTopicsForPlan = cache(
  async (planId: string): Promise<TopicForScheduler[]> => {
    const rows = await db
      .select({
        id: topics.id,
        title: topics.title,
      })
      .from(planTopics)
      .innerJoin(topics, eq(topics.id, planTopics.topicId))
      .where(eq(planTopics.planId, planId))
      .orderBy(planTopics.sortOrder)
      .all();

    return rows;
  }
);

export type SubjectSyncStatus = {
  id: string;
  name: string;
  color: string | null;
  planTopicCount: number;
  subjectTopicCount: number;
  isOutOfSync: boolean;
};

export const getPlanTopicSyncStatuses = cache(
  async (planId: string): Promise<SubjectSyncStatus[]> => {
    const planSubjects = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        color: subjects.color,
        planTopicCount: sql<number>`count(distinct ${topics.id})`,
      })
      .from(planTopics)
      .innerJoin(topics, eq(topics.id, planTopics.topicId))
      .innerJoin(subjects, eq(subjects.id, topics.subjectId))
      .where(eq(planTopics.planId, planId))
      .groupBy(subjects.id)
      .all();

    if (planSubjects.length === 0) return [];

    const subjectCounts = await db
      .select({
        subjectId: topics.subjectId,
        subjectTopicCount: sql<number>`count(*)`,
      })
      .from(topics)
      .where(inArray(topics.subjectId, planSubjects.map((s) => s.id)))
      .groupBy(topics.subjectId)
      .all();

    const countMap = new Map(
      subjectCounts.map((r) => [r.subjectId, r.subjectTopicCount])
    );

    return planSubjects.map((s) => {
      const subjectTopicCount = countMap.get(s.id) ?? 0;
      return {
        id: s.id,
        name: s.name,
        color: s.color,
        planTopicCount: s.planTopicCount,
        subjectTopicCount,
        isOutOfSync: s.planTopicCount !== subjectTopicCount,
      };
    });
  }
);
