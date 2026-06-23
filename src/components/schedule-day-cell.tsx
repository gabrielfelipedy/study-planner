"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { format } from "date-fns";
import { TopicCard } from "@/components/topic-card";
import type { TopicCardSlot } from "@/components/topic-card";

export type DayCellSlot = TopicCardSlot & {
  type: "study" | "buffer" | "catch-up" | "revision-7d" | "revision-30d";
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

  const bufferSlots = slots.filter((s) => s.type === "buffer" || s.type === "catch-up");
  const studySlots = slots.filter((s) => s.type === "study");
  const revisionSlots = slots.filter(
    (s) => s.type === "revision-7d" || s.type === "revision-30d"
  );
  const hasCatchUp = bufferSlots.some((s) => s.type === "catch-up");
  const hasBuffer = bufferSlots.some((s) => s.type === "buffer");

  let cellClasses = "min-h-[120px] border-r border-b border-border p-2 transition-colors";
  if (isToday) cellClasses += " bg-accent border-b-2 border-primary";
  else if (isOver) cellClasses += " bg-accent/50 ring-1 ring-ring";
  else if (isPast) cellClasses += " opacity-60";
  else if (!isStudyDay) cellClasses += " bg-muted/20";

  let catchUpStyle = "";
  if (hasCatchUp) {
    cellClasses += " bg-amber-950/30";
    catchUpStyle = " border-t-2 border-t-amber-600 border-dashed";
  } else if (hasBuffer) {
    cellClasses += " bg-muted/20";
  }

  return (
    <div ref={setNodeRef} className={cellClasses + catchUpStyle}>
      <div className="mb-1 text-center text-xs text-muted-foreground">
        {format(date, "d")}
      </div>
      <SortableContext items={studySlots.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        {studySlots.map((slot) => (
          <TopicCard
            key={slot.id}
            slot={slot}
            planId={planId}
            onMarked={onTopicMarked}
            onShowToast={onShowToast}
          />
        ))}
      </SortableContext>

      {revisionSlots.map((slot) => (
        <TopicCard
          key={slot.id}
          slot={slot}
          planId={planId}
          onMarked={onTopicMarked}
          onShowToast={onShowToast}
        />
      ))}

      {hasCatchUp && (
        <div className="mt-1 text-center text-xs font-medium text-amber-500">Catch-up</div>
      )}
      {hasBuffer && !hasCatchUp && (
        <div className="mt-1 text-center text-xs italic text-muted-foreground">Buffer</div>
      )}
    </div>
  );
}
