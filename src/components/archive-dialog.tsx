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
import { archiveSubject } from "@/lib/dal/commands/subjects";
import { useState } from "react";

type ArchiveDialogProps = {
  subjectId: string;
  subjectName: string;
  userId: string;
};

export function ArchiveDialog({ subjectId, subjectName, userId }: ArchiveDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleArchive() {
    setError(null);
    try {
      await archiveSubject(subjectId, userId);
      setOpen(false);
      router.push("/subjects");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to archive subject");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-red-600 hover:text-red-700">
          Archive subject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive &ldquo;{subjectName}&rdquo;?</DialogTitle>
          <DialogDescription>
            This subject and its topics will be archived and hidden from your main view.
            You can restore it later by contacting support.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
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
