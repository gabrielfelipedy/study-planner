import { cache } from "react";
import { db } from "@/lib/db/client";
import {
  studyPlans,
  scheduleSlots,
  completions,
  subjects,
  topics,
  planTopics,
} from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import type {
  DashboardStats,
  CompletionDataPoint,
  SubjectDistribution,
  WeeklyStudyHours,
  RevisionAdherence,
} from "@/types/dashboard";

/**
 * Get KPI summary stats for the dashboard.
 * Returns totalTopics, completedTopics, completionPercentage, revisionAdherencePercentage.
 * When planId is undefined, aggregates across all user plans.
 * When planId is provided, filters to that specific plan.
 */
export const getDashboardStats = cache(async (
  userId: string,
  planId?: string
): Promise<DashboardStats> => {
  // Get plan-level aggregates
  const plansQuery = db
    .select({
      totalTopics: sql<number>`coalesce(sum(${studyPlans.totalTopics}), 0)`,
      completedTopics: sql<number>`coalesce(sum(${studyPlans.completedTopics}), 0)`,
    })
    .from(studyPlans)
    .where(
      planId
        ? and(eq(studyPlans.userId, userId), eq(studyPlans.id, planId))
        : eq(studyPlans.userId, userId)
    )
    .get();

  // Count total revision-type slots scheduled vs completed across user's plans
  let revisionFilter;
  if (planId) {
    revisionFilter = and(
      sql`${scheduleSlots.type} LIKE 'revision-%'`,
      eq(scheduleSlots.planId, planId)
    );
  } else {
    // Get all plan IDs for this user to scope revision query
    const userPlans = await db
      .select({ id: studyPlans.id })
      .from(studyPlans)
      .where(eq(studyPlans.userId, userId))
      .all();
    const planIds = userPlans.map(p => p.id);
    if (planIds.length === 0) {
      return { totalTopics: 0, completedTopics: 0, completionPercentage: 0, revisionAdherencePercentage: 0 };
    }
    revisionFilter = and(
      sql`${scheduleSlots.type} LIKE 'revision-%'`,
      inArray(scheduleSlots.planId, planIds)
    );
  }

  // Get revision adherence stats
  const [planStats, revisionStats] = await Promise.all([
    plansQuery,
    db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`sum(case when ${scheduleSlots.isCompleted} then 1 else 0 end)`,
      })
      .from(scheduleSlots)
      .where(revisionFilter)
      .get(),
  ]);

  const totalTopics = planStats?.totalTopics ?? 0;
  const completedTopics = planStats?.completedTopics ?? 0;
  const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const totalRevisions = revisionStats?.total ?? 0;
  const completedRevisions = revisionStats?.completed ?? 0;
  const revisionAdherencePercentage = totalRevisions > 0 ? Math.round((completedRevisions / totalRevisions) * 100) : 0;

  return {
    totalTopics,
    completedTopics,
    completionPercentage,
    revisionAdherencePercentage,
  };
});

/**
 * Get daily completion counts with cumulative percentage for the completion-over-time chart (D-04).
 * Returns array of CompletionDataPoint sorted by date ascending.
 * When planId is undefined, aggregates across all user plans.
 */
export const getCompletionOverTime = cache(async (
  userId: string,
  planId?: string
): Promise<CompletionDataPoint[]> => {
  // Build the where condition
  const conditions = [eq(completions.userId, userId)];
  if (planId) {
    conditions.push(eq(completions.planId, planId));
  }

  // Get daily completion counts from the completions audit log
  const dailyRows = await db
    .select({
      date: completions.date,
      count: sql<number>`count(*)`,
    })
    .from(completions)
    .where(and(...conditions))
    .groupBy(completions.date)
    .orderBy(completions.date)
    .all();

  // Get total topics for cumulative percentage
  let totalTopics: number;
  if (planId) {
    const plan = await db
      .select({ total: studyPlans.totalTopics })
      .from(studyPlans)
      .where(and(eq(studyPlans.id, planId), eq(studyPlans.userId, userId)))
      .get();
    totalTopics = plan?.total ?? 0;
  } else {
    const result = await db
      .select({ total: sql<number>`coalesce(sum(${studyPlans.totalTopics}), 0)` })
      .from(studyPlans)
      .where(eq(studyPlans.userId, userId))
      .get();
    totalTopics = result?.total ?? 0;
  }

  // Compute cumulative percentages
  let cumulativeCount = 0;
  const dataPoints: CompletionDataPoint[] = dailyRows.map((row) => {
    cumulativeCount += row.count;
    return {
      date: row.date,
      completed: row.count,
      cumulativePercentage: totalTopics > 0 ? Math.round((cumulativeCount / totalTopics) * 100) : 0,
    };
  });

  return dataPoints;
});

/**
 * Get topics completed by subject for the subject distribution chart (D-05).
 * Returns array of SubjectDistribution sorted by completed count descending.
 * When planId is undefined, aggregates across all user plans.
 */
export const getSubjectDistribution = cache(async (
  userId: string,
  planId?: string
): Promise<SubjectDistribution[]> => {
  // Build plan filter for completions
  const completionConditions = planId
    ? and(eq(completions.userId, userId), eq(completions.planId, planId))
    : eq(completions.userId, userId);

  // Get completion counts per subject by joining completions -> topics -> subjects
  const completedRows = await db
    .select({
      subjectId: subjects.id,
      subjectName: subjects.name,
      subjectColor: subjects.color,
      completed: sql<number>`count(distinct ${completions.topicId})`,
    })
    .from(completions)
    .innerJoin(topics, eq(topics.id, completions.topicId))
    .innerJoin(subjects, eq(subjects.id, topics.subjectId))
    .where(completionConditions)
    .groupBy(subjects.id)
    .orderBy(sql`count(distinct ${completions.topicId}) desc`)
    .all();

  if (completedRows.length === 0) return [];

  const subjectIds = completedRows.map(r => r.subjectId);

  // Get total topics per subject
  let totalRows: Array<{ subjectId: string; total: number }>;

  if (planId) {
    // For a specific plan: count topics linked through plan_topics
    totalRows = await db
      .select({
        subjectId: subjects.id,
        total: sql<number>`count(distinct ${topics.id})`,
      })
      .from(planTopics)
      .innerJoin(topics, eq(topics.id, planTopics.topicId))
      .innerJoin(subjects, eq(subjects.id, topics.subjectId))
      .where(and(eq(planTopics.planId, planId), inArray(subjects.id, subjectIds)))
      .groupBy(subjects.id)
      .all();
  } else {
    // Cross-plan: all topics in user's subjects with completions
    totalRows = await db
      .select({
        subjectId: subjects.id,
        total: sql<number>`count(*)`,
      })
      .from(topics)
      .innerJoin(subjects, eq(subjects.id, topics.subjectId))
      .where(and(eq(subjects.userId, userId), inArray(subjects.id, subjectIds)))
      .groupBy(subjects.id)
      .all();
  }

  const totalMap = new Map(totalRows.map(r => [r.subjectId, r.total]));

  return completedRows.map(r => {
    const total = totalMap.get(r.subjectId) ?? r.completed;
    return {
      subjectName: r.subjectName,
      subjectColor: r.subjectColor,
      completed: r.completed,
      total,
      percentage: total > 0 ? Math.round((r.completed / total) * 100) : 0,
    };
  });
});

/**
 * Get weekly planned vs actual topic completion for a specific plan.
 * Returns array of WeeklyTopicCompletion sorted by weekStart ascending.
 * Planned topics = count of study-type schedule slots that week.
 * Actual topics = count of completed study-type schedule slots that week.
 */
export const getWeeklyTopicCompletion = cache(async (
  userId: string,
  planId: string
): Promise<WeeklyStudyHours[]> => {
  // Verify plan ownership first
  const plan = await db
    .select({ id: studyPlans.id })
    .from(studyPlans)
    .where(and(eq(studyPlans.id, planId), eq(studyPlans.userId, userId)))
    .get();

  if (!plan) return [];

  // Get study-type schedule slots for this plan
  const rows = await db
    .select({
      date: scheduleSlots.date,
      isCompleted: scheduleSlots.isCompleted,
    })
    .from(scheduleSlots)
    .where(
      and(
        eq(scheduleSlots.planId, planId),
        eq(scheduleSlots.type, "study")
      )
    )
    .orderBy(scheduleSlots.date)
    .all();

  // Group into ISO weeks (Monday start)
  const weekMap = new Map<string, { planned: number; actual: number }>();

  for (const row of rows) {
    const date = new Date(row.date + "T00:00:00");
    const dayOfWeek = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7));
    const weekStart = monday.toISOString().split("T")[0];

    const current = weekMap.get(weekStart) ?? { planned: 0, actual: 0 };
    current.planned += 1;
    if (row.isCompleted) {
      current.actual += 1;
    }
    weekMap.set(weekStart, current);
  }

  return Array.from(weekMap.entries())
    .map(([weekStart, vals]) => ({
      weekStart,
      plannedHours: vals.planned,
      actualHours: vals.actual,
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
});

/**
 * Get revision adherence data — scheduled vs completed revisions per week (D-07).
 * Returns array of RevisionAdherence sorted by weekStart ascending.
 * When planId is undefined, aggregates revision slots across all user plans.
 * When planId is provided, filters to that specific plan.
 */
export const getRevisionAdherence = cache(async (
  userId: string,
  planId?: string
): Promise<RevisionAdherence[]> => {
  // Get all accessible plan IDs for this user
  const userPlans = await db
    .select({ id: studyPlans.id })
    .from(studyPlans)
    .where(eq(studyPlans.userId, userId))
    .all();

  if (userPlans.length === 0) return [];

  const targetPlanIds = planId
    ? userPlans.filter(p => p.id === planId).map(p => p.id)
    : userPlans.map(p => p.id);

  if (targetPlanIds.length === 0) return [];

  // Get all revision-type slots for the target plans
  const rows = await db
    .select({
      date: scheduleSlots.date,
      isCompleted: scheduleSlots.isCompleted,
    })
    .from(scheduleSlots)
    .where(
      and(
        sql`${scheduleSlots.type} LIKE 'revision-%'`,
        inArray(scheduleSlots.planId, targetPlanIds)
      )
    )
    .orderBy(scheduleSlots.date)
    .all();

  // Group by ISO week (Monday start)
  const weekMap = new Map<string, { scheduled: number; completed: number }>();

  for (const row of rows) {
    const date = new Date(row.date + "T00:00:00");
    const dayOfWeek = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7));
    const weekStart = monday.toISOString().split("T")[0];

    const current = weekMap.get(weekStart) ?? { scheduled: 0, completed: 0 };
    current.scheduled += 1;
    if (row.isCompleted) {
      current.completed += 1;
    }
    weekMap.set(weekStart, current);
  }

  return Array.from(weekMap.entries())
    .map(([weekStart, vals]) => ({
      weekStart,
      scheduled: vals.scheduled,
      completed: vals.completed,
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
});
