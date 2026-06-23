import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPlanById } from "@/lib/dal/queries/plans";
import { StudyTimeForm } from "@/components/study-time-form";
import { ArchiveDialog } from "@/components/archive-dialog";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const { id } = await params;
  const plan = await getPlanById(id, session.user.id);
  if (!plan) notFound();

  const deadlineDate = new Date(plan.deadline);
  const startDate = new Date(plan.startDate);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{plan.title}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span>{startDate.toLocaleDateString()} → {deadlineDate.toLocaleDateString()}</span>
              <Badge variant={plan.status === "active" ? "default" : "secondary"}>
                {plan.status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/plans/${id}/edit`}>
              <Button variant="outline" size="sm">Edit</Button>
            </Link>
            <ArchiveDialog
              itemId={id}
              itemName={plan.title}
              itemType="plan"
              userId={session.user.id}
              redirectTo="/plans"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {plan.completedTopics} / {plan.totalTopics} topics completed
            </span>
            <span className="font-medium text-foreground">
              {plan.totalTopics > 0
                ? `${Math.round((plan.completedTopics / plan.totalTopics) * 100)}%`
                : "No topics"}
            </span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{
                width: plan.totalTopics > 0
                  ? `${(plan.completedTopics / plan.totalTopics) * 100}%`
                  : "0%",
              }}
            />
          </div>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium text-foreground">Subjects</h2>
        {plan.subjects.length > 0 ? (
          <div className="space-y-2">
            {plan.subjects.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center gap-3 rounded-md border bg-card px-4 py-3"
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: subject.color ?? "#3b82f6" }}
                />
                <span className="flex-1 text-sm font-medium text-foreground">
                  {subject.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {subject.topicCount} topic{subject.topicCount === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            No subjects added yet.
          </p>
        )}
      </section>

      <StudyTimeForm
        planId={id}
        userId={session.user.id}
        initialHoursPerWeek={plan.hoursPerWeek}
        initialStudyDays={plan.studyDays}
      />

      <div className="mt-8 rounded-lg border-2 border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Schedule generation will appear here in Phase 4.
        </p>
      </div>
    </div>
  );
}
