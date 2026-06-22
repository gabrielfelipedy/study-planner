import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { LogoutButton } from "./logout-button";

export async function AuthNav() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) return null;

  return (
    <nav className="flex items-center justify-end gap-4 border-b px-6 py-3">
      <span className="text-sm text-zinc-600">{session.user.email}</span>
      <LogoutButton />
    </nav>
  );
}
