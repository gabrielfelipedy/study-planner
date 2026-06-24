import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getTodaySchedule } from "@/lib/dal/queries/progress";
import { getPlansForUser } from "@/lib/dal/queries/plans";
import {
  getDashboardStats,
  getCompletionOverTime,
  getSubjectDistribution,
  getWeeklyTopicCompletion,
  getRevisionAdherence,
} from "@/lib/dal/queries/dashboard";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PlanSelector } from "@/components/dashboard/plan-selector";
import { CompletionOverTimeChart } from "@/components/dashboard/completion-over-time-chart";
import { SubjectDistributionChart } from "@/components/dashboard/subject-distribution-chart";
import { WeeklyTopicChart } from "@/components/dashboard/study-hours-chart";
import { RevisionAdherenceChart } from "@/components/dashboard/revision-adherence-chart";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const params = await searchParams;
  const selectedPlanId = params.plan ?? null;

  // Today's schedule for the progress section
  const todaySchedule: Awaited<ReturnType<typeof getTodaySchedule>> = session?.user?.id
    ? await getTodaySchedule(session.user.id)
    : [];
  const todayCompleted = todaySchedule.filter((t) => t.isCompleted).length;
  const todayTotal = todaySchedule.length;
  const todayPercentage =
    todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  // Dashboard data — only fetch if user is authenticated
  let plans: Awaited<ReturnType<typeof getPlansForUser>> = [];
  let stats: Awaited<ReturnType<typeof getDashboardStats>> | null = null;
  let completionData: Awaited<ReturnType<typeof getCompletionOverTime>> = [];
  let subjectData: Awaited<ReturnType<typeof getSubjectDistribution>> = [];
  let studyHoursData: Awaited<ReturnType<typeof getWeeklyTopicCompletion>> = [];
  let revisionData: Awaited<ReturnType<typeof getRevisionAdherence>> = [];

  if (session?.user?.id) {
    plans = await getPlansForUser(session.user.id);

    if (plans.length > 0) {
      // Fetch all dashboard data in parallel
      const planId = selectedPlanId ?? undefined;
      [stats, completionData, subjectData, revisionData] =
        await Promise.all([
          getDashboardStats(session.user.id, planId),
          getCompletionOverTime(session.user.id, planId),
          getSubjectDistribution(session.user.id, planId),
          getRevisionAdherence(session.user.id, planId),
        ]);

      // Weekly topic completion chart only works per-plan
      if (selectedPlanId) {
        studyHoursData = await getWeeklyTopicCompletion(
          session.user.id,
          selectedPlanId
        );
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4">
      <main className="flex w-full max-w-5xl flex-col">
        {session ? (
          // Authenticated view — full dashboard
          <div className="w-full py-8">
            {plans.length > 0 ? (
              <>
                {/* Plan selector + heading row */}
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">
                      Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Your study progress at a glance
                    </p>
                  </div>
                  <PlanSelector
                    plans={plans}
                    selectedPlanId={selectedPlanId}
                  />
                </div>

                {/* Today's progress section (preserved from existing) */}
                {todayTotal > 0 ? (
                  <div className="mb-6 rounded-lg border bg-card p-5 shadow-sm text-left">
                    <h2 className="text-sm font-medium text-foreground">
                      Today&apos;s progress
                    </h2>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {todayCompleted} of {todayTotal} topics studied
                        </span>
                        <span className="font-medium text-foreground">
                          {todayPercentage}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${todayPercentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      {todaySchedule.slice(0, 5).map((topic) => (
                        <div
                          key={topic.slotId}
                          className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs ${
                            topic.isCompleted
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {topic.subjectColor && (
                            <div
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor: topic.subjectColor,
                              }}
                            />
                          )}
                          <span className="flex-1 truncate">
                            {topic.topicTitle}
                          </span>
                          <span className="text-muted-foreground">
                            {topic.isCompleted ? "\u2713" : "\u2014"}
                          </span>
                        </div>
                      ))}
                      {todaySchedule.length > 5 && (
                        <p className="pt-1 text-center text-xs text-muted-foreground">
                          +{todaySchedule.length - 5} more topics
                        </p>
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <Link
                        href={
                          todaySchedule.length > 0
                            ? `/plans/${todaySchedule[0].planId}`
                            : "/plans"
                        }
                        className="text-xs text-primary hover:underline"
                      >
                        View today&apos;s schedule &rarr;
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 rounded-lg border-2 border-dashed border-border p-8 text-center">
                    <h2 className="text-sm font-medium text-foreground">
                      No topics scheduled today
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Create a study plan and generate a schedule to get
                      started.
                    </p>
                    <Link href="/plans" className="mt-3 inline-block">
                      <Button variant="outline" size="sm">
                        View plans
                      </Button>
                    </Link>
                  </div>
                )}

                {/* KPI cards row */}
                <div className="mb-6">
                  <KpiCards stats={stats} />
                </div>

                {/* Chart grid — 2 columns on desktop, single on mobile */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-lg border bg-card p-5 shadow-sm">
                    <CompletionOverTimeChart data={completionData} />
                  </div>
                  <div className="rounded-lg border bg-card p-5 shadow-sm">
                    <SubjectDistributionChart data={subjectData} />
                  </div>
                  {selectedPlanId && (
                    <div className="rounded-lg border bg-card p-5 shadow-sm">
                      <WeeklyTopicChart data={studyHoursData} />
                    </div>
                  )}
                  <div className="rounded-lg border bg-card p-5 shadow-sm">
                    <RevisionAdherenceChart data={revisionData} />
                  </div>
                </div>
              </>
            ) : (
              /* No plans state (D-13) */
              <div className="flex flex-col items-center justify-center py-16">
                <div className="max-w-md rounded-lg border-2 border-dashed border-border p-12 text-center">
                  <h2 className="text-lg font-medium text-foreground">
                    No study plans yet
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create your first study plan to see progress charts.
                  </p>
                  <div className="mt-6">
                    <Link href="/plans/new">
                      <Button>Create your first plan</Button>
                    </Link>
                  </div>
                </div>
                {/* Show today's progress even without plans if there's data */}
                {todayTotal > 0 && (
                  <div className="mt-6 w-full max-w-md rounded-lg border bg-card p-5 shadow-sm text-left">
                    <h2 className="text-sm font-medium text-foreground">
                      Today&apos;s progress
                    </h2>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {todayCompleted} of {todayTotal} topics studied
                        </span>
                        <span className="font-medium text-foreground">
                          {todayPercentage}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${todayPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Unauthenticated view — hero landing (preserved) */
          <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-6 py-24 text-center">
            <h1 className="text-2xl font-semibold">Study Planner</h1>
            <p className="text-muted-foreground">
              Automatically create daily study schedules from your topics and
              deadlines. Plan smarter, not harder.
            </p>
            <div className="flex gap-4">
              <Link href="/sign-up">
                <Button>Get started</Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline">Sign in</Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
