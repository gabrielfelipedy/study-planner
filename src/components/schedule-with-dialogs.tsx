"use client";

import { ScheduleView } from "@/components/schedule-view";

type Slot = {
  id: string;
  topicId: string;
  date: string;
  type: "study" | "revision-7d" | "revision-30d";
  isCompleted: boolean;
  topicTitle?: string;
  subjectName?: string;
  subjectColor?: string;
};

type ScheduleWithDialogsProps = {
  planId: string;
  slots: Slot[];
  startDate: string;
  deadline: string;
  hasStaleInputs: boolean;
};

export function ScheduleWithDialogs({
  planId,
  slots,
  startDate,
  deadline,
  hasStaleInputs,
}: ScheduleWithDialogsProps) {
  return (
    <ScheduleView
      slots={slots}
      planStartDate={startDate}
      planDeadline={deadline}
      planId={planId}
      isStale={hasStaleInputs}
    />
  );
}
