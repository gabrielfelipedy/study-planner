"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateScheduleAction } from "@/app/plans/[id]/actions";
import { GenerateSpinner } from "@/components/generate-spinner";
import { Button } from "@/components/ui/button";

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
    });
    return () => { mounted = false; };
  }, [planId, router]);

  if (state === "generating") {
    return <GenerateSpinner />;
  }

  if (state === "done") {
    return (
      <div>
        <p className="mb-4 text-sm text-muted-foreground">
          Schedule covers {result?.totalDays} days with ~{result?.avgTopicsPerDay} topics per day
        </p>
        <GenerateSpinner message="Loading schedule…" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-destructive/30 bg-destructive/10 p-12 text-center">
      <h3 className="text-lg font-medium text-destructive">
        Not enough study time available
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {result?.message ?? "Could not generate schedule."}
      </p>
      <div className="mt-4 flex items-center justify-center gap-3">
        <Link href={`/plans/${planId}/edit`}>
          <Button variant="outline">Adjust settings</Button>
        </Link>
        <a href="#study-time-form">
          <Button variant="default">Change study time</Button>
        </a>
      </div>
    </div>
  );
}
