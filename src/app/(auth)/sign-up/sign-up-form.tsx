"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function SignUpForm() {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      return { error: "Passwords do not match" };
    }

    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name: email.split("@")[0],
    });

    if (error) {
      return { error: error.message };
    }

    router.push("/subjects");
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
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required />
      </div>
      <Link href="/sign-in" className="text-sm text-violet-600 hover:underline">
        Already have an account? Sign in
      </Link>
      <Button type="submit" className="w-full">
        Create account
      </Button>
    </form>
  );
}
