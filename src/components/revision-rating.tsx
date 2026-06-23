"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type RevisionRatingProps = {
  slotId: string;
  planId: string;
  topicId: string;
  onComplete?: () => void;
  onError?: (message: string) => void;
};

type RatingOption = "again" | "hard" | "good" | "easy";

const RATING_LABELS: Record<RatingOption, { label: string; description: string; color: string }> = {
  again: { label: "Again", description: "Forgot — start over", color: "bg-red-500 hover:bg-red-600" },
  hard: { label: "Hard", description: "Difficult recall", color: "bg-orange-500 hover:bg-orange-600" },
  good: { label: "Good", description: "Correct with effort", color: "bg-green-500 hover:bg-green-600" },
  easy: { label: "Easy", description: "Instant recall", color: "bg-blue-500 hover:bg-blue-600" },
};

export function RevisionRating({ slotId, planId, topicId, onComplete, onError }: RevisionRatingProps) {
  const [isRating, setIsRating] = useState(false);
  const router = useRouter();

  const handleRating = useCallback(async (rating: RatingOption) => {
    setIsRating(true);
    try {
      const { reviewSlotAction } = await import("@/app/plans/[id]/actions");
      const result = await reviewSlotAction(slotId, planId, rating);
      if (result.success) {
        onComplete?.();
        router.refresh();
      } else {
        onError?.(result.message ?? "Failed to submit review");
      }
    } catch {
      onError?.("Failed to submit review. Please try again.");
    } finally {
      setIsRating(false);
    }
  }, [slotId, planId, onComplete, onError, router]);

  return (
    <div className="mt-1.5 border-t border-border pt-1.5">
      <p className="mb-1 text-[10px] font-medium text-muted-foreground">
        How well did you recall this?
      </p>
      <div className="flex gap-1">
        {(Object.entries(RATING_LABELS) as [RatingOption, typeof RATING_LABELS[RatingOption]][]).map(
          ([key, config]) => (
            <Button
              key={key}
              size="sm"
              className={`h-7 flex-1 text-[10px] font-medium text-white ${config.color}`}
              onClick={(e) => { e.stopPropagation(); handleRating(key); }}
              disabled={isRating}
              title={config.description}
              aria-label={`Rate as ${config.label}: ${config.description}`}
            >
              {isRating ? "..." : config.label}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
