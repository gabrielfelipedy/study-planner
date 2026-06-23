import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SubjectCard } from "@/components/subject-card";
import { getSubjectsForUser } from "@/lib/dal/queries/subjects";

export default async function SubjectsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const subjects = await getSubjectsForUser(session.user.id);
  const hasSubjects = subjects.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">My Subjects</h1>
        <Link href="/subjects/new">
          <Button>New subject</Button>
        </Link>
      </div>

      {hasSubjects ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {subjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-zinc-200 p-12 text-center">
          <h2 className="mb-2 text-lg font-medium text-zinc-600">No subjects yet</h2>
          <p className="mb-6 text-sm text-zinc-500">
            Create your first subject to start organizing your study material.
          </p>
          <Link href="/subjects/new">
            <Button>Create your first subject</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
