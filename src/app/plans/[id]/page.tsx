import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { differenceInDays } from "date-fns";
import { getPlanById, getPlanTopicSyncStatuses } from "@/lib/dal/queries/plans";
import { syncSubjectTopicsAction } from "./actions";
import { getScheduleSlots } from "@/lib/dal/queries/calendar";
import { ArchiveDialog } from "@/components/archive-dialog";
import { ScheduleGenerator } from "@/components/schedule-generator";
import { ScheduleWithDialogs } from "@/components/schedule-with-dialogs";
import { WeekdayToggle } from "@/components/weekday-toggle";
import { RegenerateButton } from "@/components/regenerate-button";

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
  const syncStatuses = await getPlanTopicSyncStatuses(id);
  const outOfSyncSubjects = syncStatuses.filter((s) => s.isOutOfSync);

  const hasStaleInputs =
    hasSchedule &&
    (plan.lastScheduleStartDate !== plan.startDate ||
      plan.lastScheduleDeadline !== plan.deadline);

  const deadlineDate = new Date(plan.deadline);
  const startDate = new Date(plan.startDate);

  const today = new Date();
  const daysSinceStart = differenceInDays(today, startDate) + 1;
  const totalDays = differenceInDays(deadlineDate, startDate) + 1;
  const expectedCompletions = Math.round((daysSinceStart / totalDays) * plan.totalTopics);
  const behindBy = Math.max(0, expectedCompletions - (plan.completedTopics ?? 0));

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
            <Link href={`/plans/${id}/study`}>
              <Button size="sm" className="gap-1.5">
                Study session
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <RegenerateButton planId={id} />
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
          {behindBy > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="rounded bg-amber-950/30 px-2 py-0.5 text-xs font-medium text-amber-500">
                {behindBy} topic{behindBy === 1 ? "" : "s"} behind schedule
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <WeekdayToggle
          planId={id}
          weekdays={plan.weekdays ? plan.weekdays.split(",").map(Number) : [1, 2, 3, 4, 5]}
        />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium text-foreground">Subjects</h2>
        {plan.subjects.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {plan.subjects.map((subject) => (
              <Badge
                key={subject.id}
                variant="outline"
                className="gap-1.5 px-3 py-1.5"
                style={
                  subject.color
                    ? { borderColor: subject.color, color: subject.color }
                    : undefined
                }
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: subject.color ?? "#3b82f6" }}
                />
                {subject.name}
                <span className="text-xs opacity-60">
                  {subject.topicCount}
                </span>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            No subjects added yet.
          </p>
        )}
      </section>

      {outOfSyncSubjects.length > 0 && (
        <section className="mb-8 space-y-2">
          {outOfSyncSubjects.map((subject) => (
            <div
              key={subject.id}
              className="flex items-center gap-3 rounded-md border border-amber-500/30 bg-amber-950/10 px-4 py-3"
            >
              <span className="text-sm text-amber-400">
                Topics on this plan ({subject.planTopicCount}) differ from subject{" "}
                <strong>{subject.name}</strong> ({subject.subjectTopicCount} topics).
              </span>
              <form
                action={syncSubjectTopicsAction.bind(null, id, subject.id) as unknown as (
                  formData: FormData
                ) => Promise<void>}
                className="ml-auto shrink-0"
              >
                <button
                  type="submit"
                  className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500"
                >
                  Update topics
                </button>
              </form>
            </div>
          ))}
        </section>
      )}

      <section className="mt-8">
        {!hasTopics ? (
          <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
            <h3 className="text-lg font-medium text-foreground">No schedule yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              No topics in this plan. Add topics to your subjects before generating a schedule.
            </p>
            <Link href="/subjects">
              <Button variant="default" className="mt-4">
                Manage subjects
              </Button>
            </Link>
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
              type: s.type as "study" | "revision-7d" | "revision-30d",
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
