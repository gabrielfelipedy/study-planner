import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <main className="flex flex-col items-center gap-6 text-center max-w-md">
        <h1 className="text-2xl font-semibold">Study Planner</h1>
        <p className="text-muted-foreground">
          Automatically create daily study schedules from your topics and
          deadlines. Plan smarter, not harder.
        </p>
        {session ? (
          <div className="flex gap-4">
            <Link href="/subjects">
              <Button>Go to dashboard</Button>
            </Link>
          </div>
        ) : (
          <div className="flex gap-4">
            <Link href="/sign-up">
              <Button>Get started</Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline">Sign in</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
