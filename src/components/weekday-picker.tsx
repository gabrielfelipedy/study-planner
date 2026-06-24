"use client";

import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const WEEKDAY_VALUES = [1, 2, 3, 4, 5, 6, 7] as const;

type WeekdayPickerProps = {
  value: number[];
  onChange: (weekdays: number[]) => void;
  disabled?: boolean;
};

export function WeekdayPicker({ value, onChange, disabled }: WeekdayPickerProps) {
  const selected = new Set(value);

  function toggle(day: number) {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(day)) {
      if (next.size <= 1) return;
      next.delete(day);
    } else {
      next.add(day);
    }
    onChange(Array.from(next).sort((a, b) => a - b));
  }

  return (
    <div className="flex gap-1">
      {WEEKDAY_VALUES.map((day, i) => {
        const isSelected = selected.has(day);
        return (
          <button
            key={day}
            type="button"
            disabled={disabled}
            onClick={() => toggle(day)}
            className={cn(
              "flex h-9 w-10 items-center justify-center rounded-md text-xs font-medium transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground hover:bg-primary/80"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
              disabled && "cursor-not-allowed opacity-50"
            )}
            aria-label={WEEKDAY_LABELS[i]}
            aria-pressed={isSelected}
          >
            {WEEKDAY_LABELS[i]}
          </button>
        );
      })}
    </div>
  );
}
