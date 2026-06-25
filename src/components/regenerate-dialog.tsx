"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RegenerateDialogProps = {
  planId: string;
  onRegenerate: () => Promise<void>;
  onCancel: () => void;
  onClearWarning: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warning: string | null;
};

export function RegenerateDialog({
  planId: _planId,
  onRegenerate,
  onCancel,
  onClearWarning,
  open,
  onOpenChange,
  warning,
}: RegenerateDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegenerate() {
    setSaving(true);
    setError(null);
    try {
      await onRegenerate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to regenerate");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onCancel(); onClearWarning(); } onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerate schedule?</DialogTitle>
          <DialogDescription>
            This will reschedule all uncompleted past topics to future days.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}
        {warning && (
          <div className="rounded-md bg-amber-950/30 p-3 text-sm text-amber-400" role="alert">
            {warning}
          </div>
        )}
        <DialogFooter className="sm:justify-stretch">
          {warning ? (
            <Button variant="outline" onClick={() => { onClearWarning(); onOpenChange(false); }}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" className="flex-1" onClick={() => { onOpenChange(false); onCancel(); }} disabled={saving}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleRegenerate} disabled={saving}>
                {saving ? "Generating…" : "Regenerate"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
