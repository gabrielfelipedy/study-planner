"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PlanSummary } from "@/lib/dal/queries/plans";

type PlanSelectorProps = {
  plans: PlanSummary[];
  selectedPlanId: string | null; // null = "All Plans"
};

/** Plan selector dropdown at top of dashboard (D-09, D-12).
 *  "All Plans" default option filters to cross-plan aggregate.
 *  Selecting a specific plan drills down to that plan's data.
 *  Uses URL search params for filter state. */
export function PlanSelector({ plans, selectedPlanId }: PlanSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(planId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (planId === "__all__") {
      params.delete("plan");
    } else {
      params.set("plan", planId);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="plan-selector" className="text-sm text-muted-foreground whitespace-nowrap">
        Plan:
      </label>
      <select
        id="plan-selector"
        value={selectedPlanId ?? "__all__"}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
      >
        <option value="__all__">All Plans</option>
        {plans.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.title}
          </option>
        ))}
      </select>
    </div>
  );
}
