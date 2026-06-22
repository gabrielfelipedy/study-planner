"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      return { error: "Passwords do not match" };
    }

    const { error } = await authClient.resetPassword({
      newPassword: password,
    });

    if (error) {
      return { error: error.message };
    }

    router.push("/sign-in");
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required />
      </div>
      <Button type="submit" className="w-full">
        Set new password
      </Button>
    </form>
  );
}
