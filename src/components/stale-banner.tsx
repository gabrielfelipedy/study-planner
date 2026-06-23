"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type StaleBannerProps = {
  onRegenerate: () => void;
  onDismiss?: () => void;
};

export function StaleBanner({ onRegenerate, onDismiss }: StaleBannerProps) {
  return (
    <div
      className="mb-4 flex items-start gap-2 rounded-md bg-amber-950/30 p-3 text-sm text-amber-400"
      role="alert"
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div className="flex-1">
        Schedule may not match your current settings —{" "}
        <Button
          variant="link"
          className="h-auto p-0 text-amber-400 underline"
          onClick={onRegenerate}
        >
          regenerate to update
        </Button>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-amber-500 hover:text-amber-400"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}
