import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanForm } from "@/components/plan-form";
import { getPlanForEdit } from "@/lib/dal/queries/plans";
import { getSubjectsForUser } from "@/lib/dal/queries/subjects";

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const { id } = await params;
  const plan = await getPlanForEdit(id, session.user.id);
  if (!plan) notFound();

  const subjects = await getSubjectsForUser(session.user.id);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit plan</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm
            mode="edit"
            userId={session.user.id}
            subjects={subjects.map((s) => ({
              id: s.id,
              name: s.name,
              color: s.color,
              topicCount: s.topicCount,
            }))}
            initialData={{
              id: plan.id,
              title: plan.title,
              deadline: plan.deadline,
              startDate: plan.startDate,
              selectedSubjectIds: plan.subjectIds,
              weekdays: plan.weekdays ? plan.weekdays.split(",").map(Number) : [1, 2, 3, 4, 5],
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
