"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";

export type TopicCardSlot = {
  id: string;
  topicId: string;
  title?: string;
  estimatedMinutes: number;
  isCompleted: boolean;
  subjectColor?: string;
  subjectName?: string;
};

type TopicCardProps = {
  slot: TopicCardSlot;
  isDragOverlay?: boolean;
};

export function TopicCard({ slot, isDragOverlay = false }: TopicCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragOverlay) {
    return (
      <div className="mb-1 rounded-md border bg-white p-1.5 shadow-lg opacity-90 rotate-1 scale-105 ring-1 ring-zinc-200 pointer-events-none">
        <div className="flex items-center gap-1.5">
          {slot.subjectColor && (
            <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: slot.subjectColor }} />
          )}
          <span className="truncate text-xs font-medium text-zinc-900">{slot.title ?? "Study"}</span>
          <span className="ml-auto text-xs text-zinc-500">{slot.estimatedMinutes}m</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`mb-1 flex items-center gap-1.5 rounded-md border bg-white p-1.5 text-xs transition-colors hover:bg-zinc-50 cursor-grab active:cursor-grabbing ${isDragging ? "opacity-30" : ""} ${slot.isCompleted ? "opacity-60" : ""}`}
      aria-roledescription="draggable topic"
      aria-label={`Topic: ${slot.title ?? "Study"}, Duration: ${slot.estimatedMinutes} minutes`}
    >
      {slot.subjectColor && (
        <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: slot.subjectColor }} />
      )}
      <span className="truncate flex-1 text-xs font-medium text-zinc-900">{slot.title ?? "Study"}</span>
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Pending</Badge>
      <span className="text-xs text-zinc-500">{slot.estimatedMinutes}m</span>
    </div>
  );
}
