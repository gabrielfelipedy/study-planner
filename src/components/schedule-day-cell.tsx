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
};

export function ScheduleDayCell({
  date,
  dateStr,
  slots,
  isToday,
  isPast,
  isStudyDay,
}: ScheduleDayCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${dateStr}` });

  const bufferSlots = slots.filter((s) => s.type === "buffer" || s.type === "catch-up");
  const studySlots = slots.filter((s) => s.type === "study");
  const hasCatchUp = bufferSlots.some((s) => s.type === "catch-up");
  const hasBuffer = bufferSlots.some((s) => s.type === "buffer");

  let cellClasses = "min-h-[120px] border-r border-b border-zinc-200 p-2 transition-colors";
  if (isToday) cellClasses += " bg-violet-50 border-b-2 border-violet-400";
  else if (isOver) cellClasses += " bg-violet-50/50 ring-1 ring-violet-300";
  else if (isPast) cellClasses += " opacity-60";
  else if (!isStudyDay) cellClasses += " bg-zinc-50";

  let catchUpStyle = "";
  if (hasCatchUp) {
    cellClasses += " bg-amber-50/50";
    catchUpStyle = " border-t-2 border-t-amber-200 border-dashed";
  } else if (hasBuffer) {
    cellClasses += " bg-zinc-50/50";
  }

  return (
    <div ref={setNodeRef} className={cellClasses + catchUpStyle}>
      <div className="mb-1 text-center text-xs text-zinc-400">
        {format(date, "d")}
      </div>
      <SortableContext items={studySlots.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        {studySlots.map((slot) => (
          <TopicCard key={slot.id} slot={slot} />
        ))}
      </SortableContext>
      {hasCatchUp && (
        <div className="mt-1 text-center text-xs font-medium text-amber-600">Catch-up</div>
      )}
      {hasBuffer && !hasCatchUp && (
        <div className="mt-1 text-center text-xs italic text-zinc-400">Buffer</div>
      )}
    </div>
  );
}
