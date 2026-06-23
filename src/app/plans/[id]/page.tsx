import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPlanById } from "@/lib/dal/queries/plans";
import { getScheduleSlots } from "@/lib/dal/queries/calendar";
import { StudyTimeForm } from "@/components/study-time-form";
import { ArchiveDialog } from "@/components/archive-dialog";
import { ScheduleGenerator } from "@/components/schedule-generator";
import { ScheduleWithDialogs } from "@/components/schedule-with-dialogs";

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

  const slots = await getScheduleSlots(id, plan.startDate, plan.deadline);
  const hasSchedule = slots.length > 0;
  const hasTopics = plan.totalTopics > 0;
  const hasStudyInputs = plan.hoursPerWeek && plan.studyDays;

  const hasStaleInputs =
    hasSchedule &&
    (plan.lastScheduleHoursPerWeek !== plan.hoursPerWeek ||
      plan.lastScheduleStudyDays !== plan.studyDays ||
      plan.lastScheduleStartDate !== plan.startDate ||
      plan.lastScheduleDeadline !== plan.deadline);

  const deadlineDate = new Date(plan.deadline);
  const startDate = new Date(plan.startDate);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
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

      <div id="study-time-form">
        <StudyTimeForm
          planId={id}
          userId={session.user.id}
          initialHoursPerWeek={plan.hoursPerWeek}
          initialStudyDays={plan.studyDays}
        />
      </div>

      <section className="mt-8">
        {!hasStudyInputs || !hasTopics ? (
          <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
            <h3 className="text-lg font-medium text-foreground">No schedule yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {!hasTopics
                ? "No topics in this plan. Add topics to your subjects before generating a schedule."
                : "Set your study availability and add topics to generate a schedule."}
            </p>
            {!hasStudyInputs && (
              <Link href={`/plans/${id}/edit`}>
                <Button variant="default" className="mt-4">
                  Set study time
                </Button>
              </Link>
            )}
            {!hasTopics && (
              <Link href="/subjects">
                <Button variant="default" className="mt-4">
                  Manage subjects
                </Button>
              </Link>
            )}
          </div>
        ) : !hasSchedule ? (
          <ScheduleGenerator planId={id} />
        ) : (
          <ScheduleWithDialogs
            planId={id}
            slots={slots.map((s) => ({
              id: s.id,
              topicId: s.topicId ?? "",
              date: s.date,
              type: s.type as "study" | "buffer" | "catch-up" | "revision-7d" | "revision-30d",
              estimatedMinutes: s.estimatedMinutes ?? 0,
              isCompleted: s.isCompleted,
              topicTitle: s.topicTitle ?? undefined,
              subjectName: s.subjectName ?? undefined,
              subjectColor: s.subjectColor ?? undefined,
            }))}
            startDate={plan.startDate}
            deadline={plan.deadline}
            hasStaleInputs={hasStaleInputs}
          />
        )}
      </section>
    </div>
  );
}
