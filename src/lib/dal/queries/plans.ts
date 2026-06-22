/**
 * Plan read operations.
 * 
 * TODO: Implement in Phase 3+ (Subject & Topic Management) or Phase 4 (Timetable Engine).
 * These stubs establish the function signatures that pages and components will import.
 * Actual implementations will use `import { db } from "@/lib/db/client"` and Drizzle queries.
 * 
 * Pattern: DAL query functions use React.cache() for per-request deduplication.
 * See: ARCHITECTURE.md "Pattern 1: Data Access Layer (DAL) — Repository-Lite"
 */

import { cache } from "react";

export type PlanSummary = {
  id: string;
  title: string;
  deadline: string;
  status: string;
  totalTopics: number;
  completedTopics: number;
};

export type PlanDetail = PlanSummary & {
  startDate: string;
  hoursPerDay: number | null;
  createdAt: string;
};

/**
 * Get all study plans for a user.
 * Returns lightweight summary data for plan listing pages.
 */
export const getPlansForUser = cache(async (userId: string): Promise<PlanSummary[]> => {
  // TODO: db.select().from(studyPlans).where(eq(studyPlans.userId, userId))
  return [];
});

/**
 * Get a single plan by ID with full detail.
 * Returns null if plan doesn't exist or doesn't belong to the user.
 */
export const getPlanById = cache(async (planId: string, userId: string): Promise<PlanDetail | null> => {
  // TODO: db.select().from(studyPlans).where(and(eq(studyPlans.id, planId), eq(studyPlans.userId, userId)))
  return null;
});
