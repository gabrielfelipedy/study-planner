"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { generateScheduleAction } from "@/app/plans/[id]/actions";
import { GenerateSpinner } from "@/components/generate-spinner";

type ScheduleGeneratorProps = {
  planId: string;
};

export function ScheduleGenerator({ planId }: ScheduleGeneratorProps) {
  const router = useRouter();
  const [state, setState] = useState<"generating" | "done" | "error">("generating");
  const [result, setResult] = useState<Awaited<ReturnType<typeof generateScheduleAction>> | null>(null);

  useEffect(() => {
    let mounted = true;
    generateScheduleAction(planId).then((res) => {
      if (!mounted) return;
      setResult(res);
      if (res.success) {
        setState("done");
        router.refresh();
      } else {
        setState("error");
      }
    }).catch(() => {
      if (!mounted) return;
      setResult({ success: false, message: "Failed to generate schedule" });
      setState("error");
    });
    return () => { mounted = false; };
  }, [planId, router]);

  if (state === "generating") {
    return <GenerateSpinner />;
  }

  if (state === "done") {
    return <GenerateSpinner message="Loading schedule…" />;
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-destructive/30 bg-destructive/10 p-12 text-center">
      <h3 className="text-lg font-medium text-destructive">
        Could not generate schedule
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {result?.message ?? "An error occurred."}
      </p>
    </div>
  );
}
