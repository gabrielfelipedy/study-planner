"use client";

import { Loader2 } from "lucide-react";

type GenerateSpinnerProps = {
  message?: string;
};

export function GenerateSpinner({
  message = "Generating your study schedule…",
}: GenerateSpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-12">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
