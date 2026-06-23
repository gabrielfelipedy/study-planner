import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubjectForm } from "@/components/subject-form";

export default async function NewSubjectPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create subject</CardTitle>
        </CardHeader>
        <CardContent>
          <SubjectForm mode="create" userId={session.user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
