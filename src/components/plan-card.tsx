import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { PlanSummary } from "@/lib/dal/queries/plans";

export function PlanCard({ plan }: { plan: PlanSummary }) {
  const deadlineDate = new Date(plan.deadline);
  const isOverdue = deadlineDate < new Date();
  const totalTopics = plan.totalTopics ?? 0;
  const completedTopics = plan.completedTopics ?? 0;
  const progress = totalTopics > 0 ? `${Math.round((completedTopics / totalTopics) * 100)}%` : "0%";

  return (
    <Link
      href={`/plans/${plan.id}`}
      className="group block rounded-lg border bg-card p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-medium text-foreground truncate">{plan.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Due {deadlineDate.toLocaleDateString()}
            {isOverdue ? " (overdue)" : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={isOverdue ? "destructive" : "secondary"}>
            {progress}
          </Badge>
          {plan.status !== "active" && (
            <Badge variant="outline">{plan.status}</Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
