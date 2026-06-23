"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { updatePlan } from "@/lib/actions/plans";
import { useState } from "react";

const DAYS_OF_WEEK = [
  { value: "0", label: "Sun" },
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
  { value: "6", label: "Sat" },
] as const;

type StudyTimeFormProps = {
  planId: string;
  userId: string;
  initialHoursPerWeek: number | null;
  initialStudyDays: string | null;
};

export function StudyTimeForm({
  planId,
  userId,
  initialHoursPerWeek,
  initialStudyDays,
}: StudyTimeFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hours, setHours] = useState(initialHoursPerWeek?.toString() ?? "");
  const [selectedDays, setSelectedDays] = useState<Set<string>>(
    new Set(initialStudyDays?.split(",").filter(Boolean) ?? [])
  );

  function toggleDay(day: string) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const hoursPerWeek = hours ? parseFloat(hours) : null;
      const studyDays = selectedDays.size > 0
        ? Array.from(selectedDays).sort().join(",")
        : null;

      await updatePlan(planId, userId, { hoursPerWeek, studyDays });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save study time");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <h3 className="font-medium text-foreground">Study Availability</h3>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="hoursPerWeek">Hours per week</Label>
        <Input
          id="hoursPerWeek"
          type="number"
          min="0"
          max="168"
          step="0.5"
          placeholder="e.g., 10"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Study days</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedDays.has(day.value)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          Select the days you typically study each week
        </p>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save study time"}
      </Button>
    </div>
  );
}
