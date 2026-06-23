import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSubjectById } from "@/lib/dal/queries/subjects";
import { TopicList } from "@/components/topic-list";
import { ArchiveDialog } from "@/components/archive-dialog";

export default async function SubjectDetailPage({
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-5 w-5 rounded-full"
              style={{ backgroundColor: subject.color ?? "#3b82f6" }}
            />
            <h1 className="text-2xl font-semibold text-foreground">{subject.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/subjects/${id}/edit`}>
              <Button variant="outline" size="sm">Edit</Button>
            </Link>
            <ArchiveDialog
              itemId={id}
              itemName={subject.name}
              itemType="subject"
              userId={session.user.id}
              redirectTo="/subjects"
            />
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {subject.topics.length} topic{subject.topics.length === 1 ? "" : "s"}
        </p>
      </div>

      <TopicList
        subjectId={id}
        initialTopics={subject.topics}
        userId={session.user.id}
      />
    </div>
  );
}
