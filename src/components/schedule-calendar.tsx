"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { format, eachWeekOfInterval, addDays } from "date-fns";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopicCard } from "@/components/topic-card";
import { ScheduleDayCell } from "@/components/schedule-day-cell";
import { FullDayWarning } from "@/components/full-day-warning";
import type { DayCellSlot } from "@/components/schedule-day-cell";

type Slot = {
  id: string;
  topicId: string;
  date: string;
  type: "study" | "buffer" | "catch-up" | "revision-7d" | "revision-30d";
  estimatedMinutes: number;
  isCompleted: boolean;
  topicTitle?: string;
  subjectName?: string;
  subjectColor?: string;
};

type ScheduleCalendarProps = {
  slots: Slot[];
  startDate: string;
  deadline: string;
  planId: string;
  isStale?: boolean;
};

export function ScheduleCalendar({
  slots,
  startDate,
  deadline,
  planId,
  isStale = false,
}: ScheduleCalendarProps) {
  const router = useRouter();
  const todayRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [isFullDayWarningOpen, setIsFullDayWarningOpen] = useState(false);
  const [pendingDropTarget, setPendingDropTarget] = useState<{
    slotId: string;
    targetDate: string;
    dayTotalMinutes: number;
  } | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  // Auto-scroll to current week on mount (D-08)
  useEffect(() => {
    todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Group slots by week → days
  const weeks = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(deadline);
    const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });

    return weekStarts.map((weekStart) => {
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(weekStart, i);
        const dateStr = format(date, "yyyy-MM-dd");
        const daySlots = slots.filter((s) => s.date === dateStr);
        return { date, dateStr, slots: daySlots };
      });
      return { weekStart, days };
    });
  }, [slots, startDate, deadline]);

  // Map slots to DayCellSlot format
  const dayCellSlots = useMemo(() => {
    return slots.map(
      (s): DayCellSlot => ({
        id: s.id,
        topicId: s.topicId,
        title: s.topicTitle,
        estimatedMinutes: s.estimatedMinutes,
        isCompleted: s.isCompleted,
        subjectColor: s.subjectColor,
        subjectName: s.subjectName,
        type: s.type as DayCellSlot["type"],
      })
    );
  }, [slots]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 5 },
    })
  );

  async function executeMove(slotId: string, targetDate: string) {
    setIsSaving(true);
    try {
      const { moveSlotAction } = await import("@/app/plans/[id]/actions");
      const result = await moveSlotAction(planId, {
        slotId,
        targetDate,
      });
      if (!result.success) {
        setMoveError(result.message ?? "Failed to move topic. Please try again.");
        setTimeout(() => setMoveError(null), 5000);
      }
      router.refresh();
    } catch {
      setMoveError("Failed to move topic. Please try again.");
      setTimeout(() => setMoveError(null), 5000);
    } finally {
      setIsSaving(false);
      setActiveId(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !active) {
      setActiveId(null);
      return;
    }

    const activeSlot = slots.find((s) => s.id === active.id);
    if (!activeSlot) {
      setActiveId(null);
      return;
    }

    // Determine target date from droppableId
    const targetId = over.id as string;
    if (!targetId.startsWith("day-")) {
      setActiveId(null);
      return;
    }
    const targetDate = targetId.replace("day-", "");

    // Don't move if same day
    if (targetDate === activeSlot.date) {
      setActiveId(null);
      return;
    }

    // Check capacity — show FullDayWarning if full (D-10)
    const daySlots = slots.filter(
      (s) => s.date === targetDate && s.type === "study"
    );
    const dayTotalMinutes = daySlots.reduce(
      (sum, s) => sum + s.estimatedMinutes,
      0
    );
    const MAX_MINUTES = 240;

    if (dayTotalMinutes + activeSlot.estimatedMinutes > MAX_MINUTES) {
      setPendingDropTarget({
        slotId: activeSlot.id,
        targetDate,
        dayTotalMinutes,
      });
      setIsFullDayWarningOpen(true);
      setActiveId(null);
      return;
    }

    // Proceed with the move
    executeMove(activeSlot.id, targetDate);
  }

  function handleOverbook() {
    if (!pendingDropTarget) return;
    setIsFullDayWarningOpen(false);
    executeMove(pendingDropTarget.slotId, pendingDropTarget.targetDate);
    setPendingDropTarget(null);
  }

  function handleChooseAnotherDay() {
    setIsFullDayWarningOpen(false);
    setPendingDropTarget(null);
  }

  const activeSlot = activeId
    ? slots.find((s) => s.id === activeId)
    : null;

  return (
    <div className="space-y-6">
      <FullDayWarning
        open={isFullDayWarningOpen}
        onOpenChange={(v) => {
          if (!v) handleChooseAnotherDay();
        }}
        dayTotalMinutes={pendingDropTarget?.dayTotalMinutes ?? 0}
        onOverbook={handleOverbook}
        onChooseAnotherDay={handleChooseAnotherDay}
      />

      {isStale && (
        <div
          className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800"
          role="alert"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="flex-1">
            Schedule may not match your current settings —{" "}
            <Button
              variant="link"
              className="h-auto p-0 text-amber-800 underline"
            >
              regenerate to update
            </Button>
          </div>
        </div>
      )}

      {moveError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600" role="alert">
          {moveError}
        </div>
      )}

      <div className={isSaving ? "pointer-events-none opacity-60" : ""}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={(e) => setActiveId(e.active.id as string)}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-0">
            {weeks.map((week) => {
              const weekId = format(week.weekStart, "yyyy-MM-dd");
              const isCurrentWeek = week.days.some(
                (d) => d.dateStr === today
              );

              return (
                <div
                  key={weekId}
                  ref={isCurrentWeek ? todayRef : undefined}
                  className={`scroll-mt-20 ${isCurrentWeek ? "bg-violet-50/30" : ""}`}
                >
                  {/* Day header row */}
                  <div className="grid grid-cols-7 border-b text-center text-xs font-medium text-zinc-500">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (name) => (
                        <div key={name} className="py-1">
                          {name}
                        </div>
                      )
                    )}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7">
                    {week.days.map((day) => {
                      const isToday = day.dateStr === today;
                      const isPast = day.dateStr < today;
                      const isStudyDay = day.dateStr >= startDate && day.dateStr <= deadline;

                      return (
                        <ScheduleDayCell
                          key={day.dateStr}
                          date={day.date}
                          dateStr={day.dateStr}
                          slots={dayCellSlots.filter(
                            (s) => day.slots.some((ds) => ds.id === s.id)
                          )}
                          isToday={isToday}
                          isPast={isPast}
                          isStudyDay={isStudyDay}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeSlot ? (
              <TopicCard
                slot={{
                  id: activeSlot.id,
                  topicId: activeSlot.topicId,
                  title: activeSlot.topicTitle,
                  estimatedMinutes: activeSlot.estimatedMinutes,
                  isCompleted: activeSlot.isCompleted,
                  subjectColor: activeSlot.subjectColor,
                  subjectName: activeSlot.subjectName,
                }}
                isDragOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
