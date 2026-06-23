import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/components/plan-card";
import { getPlansForUser } from "@/lib/dal/queries/plans";

export default async function PlansPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const plans = await getPlansForUser(session.user.id);
  const hasPlans = plans.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Study Plans</h1>
        <Link href="/plans/new">
          <Button>New plan</Button>
        </Link>
      </div>

      {hasPlans ? (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-zinc-200 p-12 text-center">
          <h2 className="mb-2 text-lg font-medium text-zinc-600">No study plans yet</h2>
          <p className="mb-6 text-sm text-zinc-500">
            Create a study plan to start organizing your topics and generating a schedule.
          </p>
          <Link href="/plans/new">
            <Button>Create your first plan</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
