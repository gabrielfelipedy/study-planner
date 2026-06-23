"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FullDayWarningProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayTotalMinutes: number;
  onOverbook: () => void;
  onChooseAnotherDay: () => void;
};

export function FullDayWarning({
  open,
  onOpenChange,
  dayTotalMinutes,
  onOverbook,
  onChooseAnotherDay,
}: FullDayWarningProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Day already full</DialogTitle>
          <DialogDescription>
            This day already has {dayTotalMinutes} minutes of study planned. Overbook anyway?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button variant="outline" onClick={onChooseAnotherDay}>
            Choose another day
          </Button>
          <Button variant="default" onClick={onOverbook}>
            Overbook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
