import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { LogoutButton } from "./logout-button";

export async function AuthNav() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) return null;

  return (
    <nav className="flex items-center justify-end gap-4 border-b border-border bg-background px-6 py-3">
      <Link
        href="/subjects"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Subjects
      </Link>
      <Link
        href="/plans"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Plans
      </Link>
      <span className="text-sm text-muted-foreground">{session.user.email}</span>
      <LogoutButton />
    </nav>
  );
}
