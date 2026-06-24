import { eachDayOfInterval, format, parseISO } from "date-fns";

export type SchedulerInput = {
  planId: string;
  topics: Array<{ id: string; title: string }>;
  startDate: string;
  deadline: string;
  weekdays?: number[]; // ISO: 1=Mon, 7=Sun — defaults to all days
  existingCountsByDate?: Record<string, number>; // pre-existing slot counts per date
};

export type ScheduleSlot = {
  planId: string;
  topicId: string | null;
  date: string;
  type: "study";
};

export type SchedulerOutput = {
  slots: ScheduleSlot[];
};

function isoDay(jsDay: number): number {
  return ((jsDay + 6) % 7) + 1;
}

export async function generateSchedule(
  input: SchedulerInput
): Promise<SchedulerOutput> {
  const { planId, topics, startDate, deadline, weekdays } = input;

  if (topics.length === 0) {
    return { slots: [] };
  }

  const allDays = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(deadline),
  });

  if (allDays.length === 0) {
    return { slots: [] };
  }

  const selectedWeekdays = weekdays && weekdays.length > 0
    ? new Set(weekdays)
    : new Set([1, 2, 3, 4, 5, 6, 7]);

  const studyDays = allDays.filter((d) => selectedWeekdays.has(isoDay(d.getDay())));

  if (studyDays.length === 0) {
    return { slots: [] };
  }

  const { existingCountsByDate } = input;
  const daySlots = studyDays.map((d) => ({
    date: format(d, "yyyy-MM-dd"),
    count: existingCountsByDate?.[format(d, "yyyy-MM-dd")] ?? 0,
  }));

  const slots: ScheduleSlot[] = [];

  for (const topic of topics) {
    daySlots.sort((a, b) => a.count - b.count || a.date.localeCompare(b.date));

    slots.push({
      planId,
      topicId: topic.id,
      date: daySlots[0].date,
      type: "study",
    });

    daySlots[0].count++;
  }

  return { slots };
}
