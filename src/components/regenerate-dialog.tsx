"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RegenerateDialog({
  planId: _planId,
  onRegenerate,
  onCancel,
  open,
  onOpenChange,
}: RegenerateDialogProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegenerate() {
    setSaving(true);
    setError(null);
    try {
      await onRegenerate();
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to regenerate");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); onOpenChange(v); }}>
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
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => { onOpenChange(false); onCancel(); }} disabled={saving}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRegenerate} disabled={saving}>
            {saving ? "Generating…" : "Regenerate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
