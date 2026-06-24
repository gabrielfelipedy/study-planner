"use client";

import { useState, useMemo, useCallback } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  addMonths,
  parseISO,
  isAfter,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScheduleCalendar } from "@/components/schedule-calendar";

type CalendarView = "week" | "month" | "custom";

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

type ScheduleViewProps = {
  planId: string;
  slots: Slot[];
  planStartDate: string;
  planDeadline: string;
  isStale?: boolean;
};

export function ScheduleView({
  planId,
  slots,
  planStartDate,
  planDeadline,
  isStale = false,
}: ScheduleViewProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const planStart = parseISO(planStartDate);
  const planEnd = parseISO(planDeadline);
  const isTodayInRange = todayStr >= planStartDate && todayStr <= planDeadline;

  const [viewMode, setViewMode] = useState<CalendarView>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [customStart, setCustomStart] = useState(planStartDate);
  const [customEnd, setCustomEnd] = useState(planDeadline);

  const referenceWeekStart = useMemo(() => {
    const base = isTodayInRange ? parseISO(todayStr) : planStart;
    return startOfWeek(base, { weekStartsOn: 1 });
  }, [isTodayInRange, todayStr, planStart]);

  const referenceMonthStart = useMemo(() => {
    const base = isTodayInRange ? parseISO(todayStr) : planStart;
    return startOfMonth(base);
  }, [isTodayInRange, todayStr, planStart]);

  const currentWeekStart = addWeeks(referenceWeekStart, weekOffset);
  const currentMonthStart = addMonths(referenceMonthStart, monthOffset);

  const firstWeekStart = useMemo(
    () => startOfWeek(planStart, { weekStartsOn: 1 }),
    [planStart]
  );
  const lastWeekStart = useMemo(
    () => startOfWeek(planEnd, { weekStartsOn: 1 }),
    [planEnd]
  );
  const firstMonthStart = useMemo(() => startOfMonth(planStart), [planStart]);
  const lastMonthStart = useMemo(() => startOfMonth(planEnd), [planEnd]);

  const canGoPrevWeek = isAfter(currentWeekStart, firstWeekStart);
  const canGoNextWeek = isAfter(lastWeekStart, currentWeekStart);
  const canGoPrevMonth = isAfter(currentMonthStart, firstMonthStart);
  const canGoNextMonth = isAfter(lastMonthStart, currentMonthStart);

  const { visibleStart, visibleEnd, label } = useMemo(() => {
    if (viewMode === "week") {
      const s = currentWeekStart;
      const e = endOfWeek(s, { weekStartsOn: 1 });
      const l = `${format(s, "MMMM d")} — ${format(e, "MMMM d, yyyy")}`;
      return { visibleStart: s, visibleEnd: e, label: l };
    }
    if (viewMode === "month") {
      const s = currentMonthStart;
      const e = endOfMonth(s);
      const l = format(s, "MMMM yyyy");
      return { visibleStart: s, visibleEnd: e, label: l };
    }
    const a = parseISO(customStart);
    const b = parseISO(customEnd);
    const [s, e] = a <= b ? [a, b] : [b, a];
    const l = `${format(s, "MMM d, yyyy")} — ${format(e, "MMM d, yyyy")}`;
    return { visibleStart: s, visibleEnd: e, label: l };
  }, [viewMode, currentWeekStart, currentMonthStart, customStart, customEnd]);

  const filteredSlots = useMemo(() => {
    const startStr = format(visibleStart, "yyyy-MM-dd");
    const endStr = format(visibleEnd, "yyyy-MM-dd");
    return slots.filter((s) => s.date >= startStr && s.date <= endStr);
  }, [slots, visibleStart, visibleEnd]);

  const handlePrev = useCallback(() => {
    if (viewMode === "week") setWeekOffset((o) => o - 1);
    else if (viewMode === "month") setMonthOffset((o) => o - 1);
  }, [viewMode]);

  const handleNext = useCallback(() => {
    if (viewMode === "week") setWeekOffset((o) => o + 1);
    else if (viewMode === "month") setMonthOffset((o) => o + 1);
  }, [viewMode]);

  const handleViewModeChange = useCallback(
    (mode: CalendarView) => {
      setViewMode(mode);
      if (mode === "custom") {
        setCustomStart(planStartDate);
        setCustomEnd(planDeadline);
      }
    },
    [planStartDate, planDeadline]
  );

  const canGoPrev =
    viewMode === "week"
      ? canGoPrevWeek
      : viewMode === "month"
        ? canGoPrevMonth
        : false;
  const canGoNext =
    viewMode === "week"
      ? canGoNextWeek
      : viewMode === "month"
        ? canGoNextMonth
        : false;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {viewMode !== "custom" ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                disabled={!canGoPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[200px] text-center text-sm font-medium tabular-nums">
                {label}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                disabled={!canGoNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-9 w-40"
              />
              <span className="text-muted-foreground">—</span>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-9 w-40"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {(["week", "month", "custom"] as const).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewModeChange(mode)}
            >
              {mode === "week" ? "Week" : mode === "month" ? "Month" : "Custom"}
            </Button>
          ))}
        </div>
      </div>

      <ScheduleCalendar
        slots={filteredSlots}
        startDate={format(visibleStart, "yyyy-MM-dd")}
        deadline={format(visibleEnd, "yyyy-MM-dd")}
        planId={planId}
        isStale={isStale}
        planStartDate={planStartDate}
        planDeadline={planDeadline}
      />
    </div>
  );
}
