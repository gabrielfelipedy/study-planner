"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSubject, updateSubject } from "@/lib/actions/subjects";
import { useState } from "react";

const SUBJECT_COLORS = [
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#06b6d4", label: "Cyan" },
] as const;

type SubjectFormProps = {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    name: string;
    color: string | null;
  };
  userId: string;
};

export function SubjectForm({ mode, initialData, userId }: SubjectFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const name = formData.get("name") as string;
    const color = formData.get("color") as string;

    if (!name?.trim()) {
      setError("Subject name is required");
      return;
    }

    if (mode === "create") {
      try {
        await createSubject({ userId, name: name.trim(), color });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create subject");
        return;
      }
      router.push("/subjects");
    } else if (initialData) {
      await updateSubject(initialData.id, userId, { name: name.trim(), color });
      router.push("/subjects");
    }
  }

  const selectedColor = initialData?.color ?? SUBJECT_COLORS[0].value;

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Subject name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="e.g., Mathematics"
          required
          defaultValue={initialData?.name ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <Select name="color" defaultValue={selectedColor}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUBJECT_COLORS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: c.value }}
                  />
                  {c.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">
        {mode === "create" ? "Create subject" : "Save changes"}
      </Button>
    </form>
  );
}
