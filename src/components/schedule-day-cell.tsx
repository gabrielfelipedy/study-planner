"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { format } from "date-fns";
import { TopicCard } from "@/components/topic-card";
import type { TopicCardSlot } from "@/components/topic-card";

export type DayCellSlot = TopicCardSlot & {
  type: "study" | "revision-7d" | "revision-30d";
};

type ScheduleDayCellProps = {
  date: Date;
  dateStr: string;
  slots: DayCellSlot[];
  isToday: boolean;
  isPast: boolean;
  isStudyDay: boolean;
  planId?: string;
  onTopicMarked?: () => void;
  onShowToast?: (message: string) => void;
};

export function ScheduleDayCell({
  date,
  dateStr,
  slots,
  isToday,
  isPast,
  isStudyDay,
  planId,
  onTopicMarked,
  onShowToast,
}: ScheduleDayCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${dateStr}` });

  const studySlots = slots.filter((s) => s.type === "study");
  const revisionSlots = slots.filter(
    (s) => s.type === "revision-7d" || s.type === "revision-30d"
  );
  const hasBehind = isPast && studySlots.some((s) => !s.isCompleted);

  let cellClasses = "min-h-[120px] border-r border-b border-border p-2 transition-colors";
  if (isToday) cellClasses += " bg-accent border-b-2 border-primary";
  else if (isOver) cellClasses += " bg-accent/50 ring-1 ring-ring";
  else if (isPast) cellClasses += " opacity-60";
  else if (!isStudyDay) cellClasses += " bg-muted/20";

  if (hasBehind) {
    cellClasses += " bg-amber-950/20";
  }

  const behindTopicIds = new Set(
    isPast
      ? studySlots.filter((s) => !s.isCompleted).map((s) => s.topicId)
      : []
  );

  const enrichedStudySlots = studySlots.map((s) => ({
    ...s,
    isBehind: s.topicId ? behindTopicIds.has(s.topicId) : false,
  }));

  const enrichedRevisionSlots = revisionSlots.map((s) => ({
    ...s,
    isBehind: isPast && !s.isCompleted,
  }));

  return (
    <div ref={setNodeRef} className={cellClasses}>
      <div className="mb-1 text-center text-xs text-muted-foreground">
        {format(date, "d")}
      </div>
      <SortableContext items={enrichedStudySlots.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        {enrichedStudySlots.map((slot) => (
          <TopicCard
            key={slot.id}
            slot={slot}
            planId={planId}
            onMarked={onTopicMarked}
            onShowToast={onShowToast}
          />
        ))}
      </SortableContext>

      {enrichedRevisionSlots.map((slot) => (
        <TopicCard
          key={slot.id}
          slot={slot}
          planId={planId}
          onMarked={onTopicMarked}
          onShowToast={onShowToast}
        />
      ))}
    </div>
  );
}
