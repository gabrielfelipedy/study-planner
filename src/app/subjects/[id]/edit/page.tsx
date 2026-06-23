import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubjectForm } from "@/components/subject-form";
import { getSubjectById } from "@/lib/dal/queries/subjects";

export default async function EditSubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const { id } = await params;
  const subject = await getSubjectById(id, session.user.id);
  if (!subject) notFound();

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit subject</CardTitle>
        </CardHeader>
        <CardContent>
          <SubjectForm
            mode="edit"
            initialData={{ id: subject.id, name: subject.name, color: subject.color }}
            userId={session.user.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
