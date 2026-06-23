/**
 * Timetable generation engine — deterministic topic distribution algorithm.
 *
 * This is the CORE DIFFERENTIATOR of the entire application.
 * It takes topics + deadline + available time and produces daily schedule slots.
 *
 * Design constraints:
 * - Pre-feasibility check: sum(topic hours × buffer) <= available hours × 0.7
 * - 70% capacity scheduling (30% buffer blocks)
 * - 25% planning fallacy buffer on user estimates
 * - Catch-up blocks (1 day per week)
 * - Daily study cap (max 4 hours)
 */

import { eachDayOfInterval, differenceInDays, format } from "date-fns";

export type SchedulerInput = {
  planId: string;
  topics: Array<{ id: string; title: string; estimatedHours: number }>;
  startDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  hoursPerWeek: number;
  studyDays: number[]; // 0=Sun...6=Sat
};

export type FeasibilityResult = {
  possible: boolean;
  totalHoursRequired: number;
  totalHoursAvailable: number;
  message?: string;
};

export type ScheduleSlot = {
  planId: string;
  topicId: string | null;
  date: string; // YYYY-MM-DD
  type: "study" | "buffer" | "catch-up";
  estimatedMinutes: number;
};

export type SchedulerOutput = {
  slots: ScheduleSlot[];
  feasibility: FeasibilityResult;
  catchUpDates: string[]; // YYYY-MM-DD dates that are catch-up days
};

const PLANNING_FALACY_BUFFER = 1.25; // 25% buffer on estimates
const CAPACITY_RATIO = 0.7; // 70% capacity (30% free)
const MAX_MINUTES_PER_DAY = 240; // 4 hours max per day
const CATCHUP_DAYS_PER_WEEK = 1; // reserve 1 day per week

/**
 * Generate a daily study schedule distributing topics evenly before the deadline.
 * Pure deterministic function — same input always produces same output.
 * Does NOT persist to DB — caller (Server Action) handles save via DAL command.
 */
export async function generateSchedule(
  input: SchedulerInput
): Promise<SchedulerOutput> {
  const { planId, topics, startDate, deadline, hoursPerWeek, studyDays } =
    input;

  // 1. Apply planning fallacy buffer to total required hours
  const totalAdjustedHours = topics.reduce(
    (sum, t) => sum + t.estimatedHours * PLANNING_FALACY_BUFFER,
    0
  );

  // 2. Calculate available study window
  const totalDays = differenceInDays(deadline, startDate) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);
  const totalAvailableHours = hoursPerWeek * totalWeeks;
  const totalUsableHours = totalAvailableHours * CAPACITY_RATIO;

  // 3. Feasibility check
  if (totalAdjustedHours > totalUsableHours) {
    return {
      slots: [],
      feasibility: {
        possible: false,
        totalHoursRequired: Math.round(totalAdjustedHours * 10) / 10,
        totalHoursAvailable: Math.round(totalUsableHours * 10) / 10,
        message: `You need ~${Math.round(totalAdjustedHours)}h of study but only have ~${Math.round(totalUsableHours)}h available at ${hoursPerWeek}h/week over ${totalWeeks} weeks. Try extending the deadline, reducing topics, or increasing weekly hours.`,
      },
      catchUpDates: [],
    };
  }

  // 4. Collect eligible study days
  const allDays = eachDayOfInterval({
    start: new Date(startDate),
    end: new Date(deadline),
  });

  const studyDaySlots: Array<{ date: Date; isCatchUp: boolean }> = [];

  for (const day of allDays) {
    if (studyDays.includes(day.getDay())) {
      const weekOffset = Math.floor(
        differenceInDays(day, new Date(startDate)) / 7
      );
      const daysInThisWeek = studyDaySlots.filter(
        (s) =>
          Math.floor(differenceInDays(s.date, new Date(startDate)) / 7) ===
          weekOffset
      ).length;
      const isCatchUp =
        daysInThisWeek >= studyDays.length - CATCHUP_DAYS_PER_WEEK;
      studyDaySlots.push({ date: day, isCatchUp });
    }
  }

  const regularDays = studyDaySlots.filter((s) => !s.isCatchUp);
  const catchUpDays = studyDaySlots.filter((s) => s.isCatchUp);

  // 5. Distribute topics round-robin across regular study days
  const slots: ScheduleSlot[] = [];
  const minutesPerTopic = Math.round(
    (totalAdjustedHours * 60) / topics.length
  );

  const minutesPerDay = Math.min(
    Math.round((totalUsableHours * 60) / regularDays.length),
    MAX_MINUTES_PER_DAY
  );

  const topicsPerDay = Math.max(
    1,
    Math.floor(minutesPerDay / minutesPerTopic)
  );

  let topicIndex = 0;

  for (const { date } of regularDays) {
    if (topicIndex >= topics.length) break;

    const dateStr = format(date, "yyyy-MM-dd");
    let dailyMinutes = 0;

    for (let i = 0; i < topicsPerDay && topicIndex < topics.length; i++) {
      const topic = topics[topicIndex];
      const topicMinutes = Math.min(
        Math.round(topic.estimatedHours * 60 * PLANNING_FALACY_BUFFER),
        MAX_MINUTES_PER_DAY - dailyMinutes
      );

      slots.push({
        planId,
        topicId: topic.id,
        date: dateStr,
        type: "study",
        estimatedMinutes: topicMinutes,
      });

      dailyMinutes += topicMinutes;
      topicIndex++;
    }
  }

  // 6. Collect catch-up date strings
  const catchUpDates = catchUpDays.map(({ date }) => format(date, "yyyy-MM-dd"));

  return {
    slots,
    feasibility: {
      possible: true,
      totalHoursRequired: Math.round(totalAdjustedHours * 10) / 10,
      totalHoursAvailable: Math.round(totalUsableHours * 10) / 10,
    },
    catchUpDates,
  };
}
