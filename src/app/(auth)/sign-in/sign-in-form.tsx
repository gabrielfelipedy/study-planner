"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function SignInForm({ callback }: { callback?: string }) {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { data, error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    router.push(callback || "/subjects");
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <div className="text-sm">
        <Link href="/forgot-password" className="text-violet-600 hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" className="w-full">
        Sign in
      </Button>
      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-violet-600 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
