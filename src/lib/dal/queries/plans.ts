import { cache } from "react";
import { db } from "@/lib/db/client";
import { studyPlans, planTopics, subjects, topics } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

export type PlanSummary = {
  id: string;
  title: string;
  deadline: string;
  status: string | null;
  totalTopics: number | null;
  completedTopics: number | null;
  hoursPerWeek: number | null;
  studyDays: string | null;
};

export type PlanWithSubjects = PlanSummary & {
  startDate: string;
  hoursPerDay: number | null;
  createdAt: string;
  archivedAt: string | null;
  totalTopics: number;
  completedTopics: number;
  lastScheduleHoursPerWeek: number | null;
  lastScheduleStudyDays: string | null;
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
  return db
    .select({
      id: studyPlans.id,
      title: studyPlans.title,
      deadline: studyPlans.deadline,
      status: studyPlans.status,
      totalTopics: studyPlans.totalTopics,
      completedTopics: studyPlans.completedTopics,
      hoursPerWeek: studyPlans.hoursPerWeek,
      studyDays: studyPlans.studyDays,
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
    hoursPerDay: plan.hoursPerDay,
    hoursPerWeek: plan.hoursPerWeek,
    studyDays: plan.studyDays,
    createdAt: plan.createdAt,
    archivedAt: plan.archivedAt,
    lastScheduleHoursPerWeek: plan.lastScheduleHoursPerWeek,
    lastScheduleStudyDays: plan.lastScheduleStudyDays,
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
  estimatedHours: number;
};

export const getTopicsForPlan = cache(
  async (planId: string): Promise<TopicForScheduler[]> => {
    const rows = await db
      .select({
        id: topics.id,
        title: topics.title,
        estimatedHours: topics.estimatedHours,
      })
      .from(planTopics)
      .innerJoin(topics, eq(topics.id, planTopics.topicId))
      .where(eq(planTopics.planId, planId))
      .orderBy(planTopics.sortOrder)
      .all();

    return rows.map((r) => ({
      ...r,
      estimatedHours: r.estimatedHours ?? 1.0,
    }));
  }
);
