"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

type ArchiveDialogProps = {
  itemId: string;
  itemName: string;
  itemType: "subject" | "plan";
  userId: string;
  redirectTo: string;
};

export function ArchiveDialog({
  itemId,
  itemName,
  itemType,
  userId,
  redirectTo,
}: ArchiveDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleArchive() {
    setError(null);
    try {
      if (itemType === "subject") {
        const { archiveSubject } = await import("@/lib/dal/commands/subjects");
        await archiveSubject(itemId, userId);
      } else {
        const { archivePlan } = await import("@/lib/dal/commands/plans");
        await archivePlan(itemId, userId);
      }
      setOpen(false);
      router.push(redirectTo);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to archive");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-destructive hover:text-destructive/80">
          Archive {itemType}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive &ldquo;{itemName}&rdquo;?</DialogTitle>
          <DialogDescription>
            This {itemType} will be archived and hidden from your main view.
            You can restore it later.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleArchive}>
            Archive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
