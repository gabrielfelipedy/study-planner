"use client";

import type { DashboardStats } from "@/types/dashboard";

type KpiCardsProps = {
  stats: DashboardStats | null;
};

/** KPI summary cards row displayed at top of dashboard (D-08).
 *  Shows: total topics, completion %, revision adherence %.
 *  When stats is null, renders a skeleton loading state. */
export function KpiCards({ stats }: KpiCardsProps) {
  if (!stats) {
    // Loading skeleton
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border-card-border border-[0.5px] bg-card p-5 shadow-sm animate-pulse">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="mt-2 h-7 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Topics",
      value: stats.totalTopics.toLocaleString(),
      secondary: `${stats.completedTopics} completed`,
    },
    {
      label: "Completion",
      value: `${stats.completionPercentage}%`,
      secondary: `${stats.completedTopics} of ${stats.totalTopics} topics`,
    },
    {
      label: "Revision Adherence",
      value: `${stats.revisionAdherencePercentage}%`,
      secondary: "Scheduled vs completed",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border-card-border border-[0.5px] bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{card.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{card.secondary}</p>
        </div>
      ))}
    </div>
  );
}
