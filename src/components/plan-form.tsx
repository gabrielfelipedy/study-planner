"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createPlan, updatePlan, addSubjectToPlan, removeSubjectFromPlan } from "@/lib/dal/commands/plans";
import { useState } from "react";

type SubjectOption = {
  id: string;
  name: string;
  color: string | null;
  topicCount: number;
};

type PlanFormProps = {
  mode: "create" | "edit";
  userId: string;
  subjects: SubjectOption[];
  initialData?: {
    id: string;
    title: string;
    deadline: string;
    startDate: string;
    selectedSubjectIds: string[];
  };
};

export function PlanForm({ mode, userId, subjects, initialData }: PlanFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialData?.selectedSubjectIds ?? [])
  );

  function toggleSubject(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(formData: FormData) {
    setError(null);

    const title = formData.get("title") as string;
    const deadline = formData.get("deadline") as string;
    const startDate = formData.get("startDate") as string;

    if (!title?.trim()) { setError("Plan title is required"); return; }
    if (!deadline) { setError("Deadline is required"); return; }
    if (!startDate) { setError("Start date is required"); return; }
    if (selectedIds.size === 0) { setError("Select at least one subject"); return; }

    try {
      if (mode === "create") {
        const result = await createPlan({
          userId,
          title: title.trim(),
          deadline,
          startDate,
          subjectIds: Array.from(selectedIds),
        });
        router.push(`/plans/${result.id}`);
      } else if (initialData) {
        await updatePlan(initialData.id, userId, {
          title: title.trim(),
          deadline,
          startDate,
        });

        const current = new Set(initialData.selectedSubjectIds);
        const toAdd = Array.from(selectedIds).filter((id) => !current.has(id));
        const toRemove = Array.from(current).filter((id) => !selectedIds.has(id));

        for (const subjectId of toAdd) {
          await addSubjectToPlan(initialData.id, subjectId, userId);
        }
        for (const subjectId of toRemove) {
          await removeSubjectFromPlan(initialData.id, subjectId, userId);
        }

        router.push(`/plans/${initialData.id}`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save plan");
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Plan title</Label>
        <Input
          id="title"
          name="title"
          type="text"
          placeholder="e.g., Midterm prep"
          required
          defaultValue={initialData?.title ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={initialData?.startDate ?? today}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            name="deadline"
            type="date"
            required
            defaultValue={initialData?.deadline ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Subjects</Label>
        <p className="text-xs text-zinc-500">
          Select subjects to include. All topics under selected subjects will be
          added to this plan.
        </p>
        {subjects.length === 0 ? (
          <p className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-500">
            No subjects available.{" "}
            <a href="/subjects/new" className="text-violet-600 hover:underline">
              Create a subject
            </a>{" "}
            first.
          </p>
        ) : (
          <div className="space-y-2 rounded-lg border p-4">
            {subjects.map((subject) => (
              <label
                key={subject.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-zinc-50"
              >
                <Checkbox
                  checked={selectedIds.has(subject.id)}
                  onCheckedChange={() => toggleSubject(subject.id)}
                />
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: subject.color ?? "#3b82f6" }}
                />
                <span className="flex-1 text-sm font-medium text-zinc-900">
                  {subject.name}
                </span>
                <span className="text-xs text-zinc-500">
                  {subject.topicCount} topic{subject.topicCount === 1 ? "" : "s"}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={subjects.length === 0}>
        {mode === "create" ? "Create plan" : "Save changes"}
      </Button>
    </form>
  );
}
