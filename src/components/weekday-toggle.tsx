"use client";

import { useState, useTransition } from "react";
import { WeekdayPicker } from "@/components/weekday-picker";
import { updateWeekdaysAction } from "@/app/plans/[id]/actions";
import { useRouter } from "next/navigation";

type WeekdayToggleProps = {
  planId: string;
  weekdays: number[];
};

export function WeekdayToggle({ planId, weekdays: initialWeekdays }: WeekdayToggleProps) {
  const [weekdays, setWeekdays] = useState<number[]>(initialWeekdays);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(newWeekdays: number[]) {
    setWeekdays(newWeekdays);
    startTransition(async () => {
      await updateWeekdaysAction(planId, newWeekdays);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-foreground">Study days</span>
      <WeekdayPicker
        value={weekdays}
        onChange={handleChange}
        disabled={isPending}
      />
      {isPending && (
        <span className="text-xs text-muted-foreground animate-pulse">
          Updating schedule...
        </span>
      )}
    </div>
  );
}
