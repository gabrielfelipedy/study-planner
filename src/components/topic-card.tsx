"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RevisionRating } from "@/components/revision-rating";

export type TopicCardSlot = {
  id: string;
  topicId: string;
  title?: string;
  isCompleted: boolean;
  subjectColor?: string;
  subjectName?: string;
  type?: "study" | "revision-7d" | "revision-30d";
  isBehind?: boolean;
};

type TopicCardProps = {
  slot: TopicCardSlot;
  isDragOverlay?: boolean;
  planId?: string;
  onMarked?: () => void;
  onShowToast?: (message: string) => void;
};

export function TopicCard({
  slot,
  isDragOverlay = false,
  planId,
  onMarked,
  onShowToast,
}: TopicCardProps) {
  const isRevision = slot.type === "revision-7d" || slot.type === "revision-30d";
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id, disabled: isRevision });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [mounted, setMounted] = useState(false);
  const [showMarkButton, setShowMarkButton] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function handleCardClick() {
    if (isDragging || isDragOverlay || isMarking || !planId) return;
    if (slot.isCompleted && isRevision) return;
    setShowMarkButton((prev) => !prev);
  }

  const handleMarkComplete = useCallback(async () => {
    if (!planId) return;
    setIsMarking(true);
    try {
      const { markTopicStudiedAction } = await import("@/app/plans/[id]/actions");
      const result = await markTopicStudiedAction(planId, slot.topicId);
      if (result.success) {
        onMarked?.();
        onShowToast?.("Topic marked as studied! ✓");
        setShowMarkButton(false);
      }
    } finally {
      setIsMarking(false);
    }
  }, [planId, slot.topicId, onMarked, onShowToast]);

  const handleUnmarkComplete = useCallback(async () => {
    if (!planId) return;
    setIsMarking(true);
    try {
      const { unmarkTopicStudiedAction } = await import("@/app/plans/[id]/actions");
      const result = await unmarkTopicStudiedAction(planId, slot.topicId);
      if (result.success) {
        onMarked?.();
        onShowToast?.("Topic marked as pending");
        setShowMarkButton(false);
      }
    } finally {
      setIsMarking(false);
    }
  }, [planId, slot.topicId, onMarked, onShowToast]);

  if (isDragOverlay) {
    return (
      <div className="mb-1 rounded-md border bg-card p-1.5 shadow-lg opacity-90 rotate-1 scale-105 ring-1 ring-border pointer-events-none">
        <div className="flex items-center gap-1.5">
          {slot.subjectColor && (
            <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: slot.subjectColor }} />
          )}
          <span className="text-xs font-medium text-foreground">{slot.title ?? "Study"}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(mounted ? attributes : {})}
      {...listeners}
      onClick={handleCardClick}
      className={`mb-1 rounded-md border bg-card p-1.5 text-xs transition-colors hover:bg-muted/50 ${isRevision ? "cursor-pointer border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40" : "cursor-grab active:cursor-grabbing"} ${isDragging ? "opacity-30" : ""} ${slot.isCompleted ? "opacity-60" : ""} ${slot.isBehind ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40" : ""}`}
      aria-roledescription="draggable topic"
      aria-label={`Topic: ${slot.title ?? "Study"}`}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          {slot.subjectColor && (
            <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: slot.subjectColor }} />
          )}
          <span className="line-clamp-2 flex-1 text-xs font-medium text-foreground" title={slot.title ?? "Study"}>{slot.title ?? "Study"}</span>
        </div>
        <div className="flex justify-end mt-0.5">
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 ${slot.isCompleted ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ""} ${isRevision && !slot.isCompleted ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" : ""}`}
          >
            {slot.isCompleted ? "✓" : isRevision ? "Review" : "Pending"}
          </Badge>
        </div>
      </div>
      {showMarkButton && (
        <div className="mt-1.5 border-t border-border pt-1.5">
          {isRevision ? (
            <RevisionRating
              slotId={slot.id}
              planId={planId ?? ""}
              topicId={slot.topicId}
              onComplete={() => {
                onMarked?.();
                onShowToast?.("Review recorded! ✓");
                setShowMarkButton(false);
              }}
              onError={(msg) => onShowToast?.(msg)}
            />
          ) : slot.isCompleted ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-full text-xs"
                onClick={(e) => { e.stopPropagation(); handleUnmarkComplete(); }}
                disabled={isMarking}
              >
                {isMarking ? "Unmarking..." : "Unmark"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="default"
                className="h-7 w-full text-xs"
                onClick={(e) => { e.stopPropagation(); handleMarkComplete(); }}
                disabled={isMarking}
              >
                {isMarking ? "Marking..." : "Mark studied"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
