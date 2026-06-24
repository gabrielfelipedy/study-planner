"use client";

import { useMemo } from "react";
import { eachDayOfInterval } from "date-fns";

function isoDay(jsDay: number): number {
  return ((jsDay + 6) % 7) + 1;
}

type SchedulePreviewProps = {
  topicCount: number;
  startDate: string;
  deadline: string;
  weekdays: number[];
};

export function SchedulePreview({
  topicCount,
  startDate,
  deadline,
  weekdays,
}: SchedulePreviewProps) {
  const studyDays = useMemo(() => {
    if (topicCount === 0) return 0;

    const allDays = eachDayOfInterval({
      start: new Date(startDate),
      end: new Date(deadline),
    });

    if (allDays.length === 0) return 0;

    const selectedSet = new Set(weekdays);
    return allDays.filter((d) => selectedSet.has(isoDay(d.getDay()))).length;
  }, [topicCount, startDate, deadline, weekdays]);

  if (studyDays === 0) return null;

  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">
        {topicCount} topics across {studyDays} study days
      </p>
    </div>
  );
}
