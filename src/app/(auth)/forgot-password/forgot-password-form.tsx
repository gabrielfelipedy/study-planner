"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function ForgotPasswordForm() {
  async function handleSubmit(formData: FormData) {
    const email = formData.get("email") as string;

    const { error } = await authClient.forgetPassword({
      email,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <p className="text-sm text-zinc-500">
        Enter your email address and we&apos;ll send you a link to reset your password.
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
