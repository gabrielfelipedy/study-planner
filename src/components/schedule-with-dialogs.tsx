"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { RegenerateDialog } from "@/components/regenerate-dialog";
import { regenerateScheduleAction } from "@/app/plans/[id]/actions";

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

type ScheduleWithDialogsProps = {
  planId: string;
  slots: Slot[];
  startDate: string;
  deadline: string;
  hasStaleInputs: boolean;
};

export function ScheduleWithDialogs({
  planId,
  slots,
  startDate,
  deadline,
  hasStaleInputs,
}: ScheduleWithDialogsProps) {
  const router = useRouter();
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [keepCurrentSchedule, setKeepCurrentSchedule] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (hasStaleInputs) {
      setShowRegenerateDialog(true);
    }
  }, [hasStaleInputs]);

  const handleRegenerate = useCallback(async () => {
    setIsSaving(true);
    try {
      await regenerateScheduleAction(planId);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }, [planId, router]);

  const handleKeep = useCallback(() => {
    setKeepCurrentSchedule(true);
    setShowRegenerateDialog(false);
  }, []);

  const handleCancel = useCallback(() => {
    setShowRegenerateDialog(false);
    setKeepCurrentSchedule(false);
  }, []);

  const isStale = hasStaleInputs && keepCurrentSchedule;

  return (
    <>
      <RegenerateDialog
        planId={planId}
        onRegenerate={handleRegenerate}
        onKeep={handleKeep}
        onCancel={handleCancel}
        open={showRegenerateDialog}
        onOpenChange={(v) => { if (!v) handleCancel(); setShowRegenerateDialog(v); }}
      />
      {isSaving && (
        <div className="mb-4 rounded-md bg-accent p-3 text-sm text-muted-foreground">
          Regenerating schedule…
        </div>
      )}
      <ScheduleCalendar
        slots={slots}
        startDate={startDate}
        deadline={deadline}
        planId={planId}
        isStale={isStale}
      />
    </>
  );
}
