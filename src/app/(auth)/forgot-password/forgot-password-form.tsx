"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const email = formData.get("email") as string;

    const { error } = await authClient.requestPasswordReset({
      email,
    });

    if (error) {
      setError(error.message ?? "Something went wrong");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-zinc-600">
          If an account with that email exists, you&apos;ll receive a password
          reset link shortly.
        </p>
        <Link
          href="/sign-in"
          className="text-sm text-violet-600 hover:underline inline-block"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-sm text-zinc-500">
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </p>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" required />
      </div>
      <Button type="submit" className="w-full">
        Send reset link
      </Button>
      <p className="text-center text-sm text-zinc-500">
        <Link href="/sign-in" className="text-violet-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
