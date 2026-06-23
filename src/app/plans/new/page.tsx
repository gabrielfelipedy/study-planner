import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanForm } from "@/components/plan-form";
import { getSubjectsForUser } from "@/lib/dal/queries/subjects";

export default async function NewPlanPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const subjects = await getSubjectsForUser(session.user.id);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create study plan</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm
            mode="create"
            userId={session.user.id}
            subjects={subjects.map((s) => ({
              id: s.id,
              name: s.name,
              color: s.color,
              topicCount: s.topicCount,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
