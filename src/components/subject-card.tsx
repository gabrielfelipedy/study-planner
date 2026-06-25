import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { SubjectSummary } from "@/lib/dal/queries/subjects";

export function SubjectCard({ subject }: { subject: SubjectSummary }) {
  return (
    <Link
      href={`/subjects/${subject.id}`}
      className="group block rounded-lg border-card-border border-[0.5px] bg-card p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: subject.color ?? "#3b82f6" }}
            aria-label={`Color: ${subject.color}`}
          />
          <h3 className="font-medium text-foreground">{subject.name}</h3>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {subject.topicCount} topic{subject.topicCount === 1 ? "" : "s"}
        </Badge>
      </div>
    </Link>
  );
}
