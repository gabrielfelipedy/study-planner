"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type BulkAddTextareaProps = {
  subjectId: string;
  onAdd: (subjectId: string, titles: string[]) => Promise<void>;
};

export function BulkAddTextarea({ subjectId, onAdd }: BulkAddTextareaProps) {
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  async function handleSubmit() {
    if (lines.length === 0) return;
    setAdding(true);
    setError(null);
    try {
      await onAdd(subjectId, lines);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create topics");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="bulk-topics">Add topics</Label>
      <textarea
        id="bulk-topics"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Type or paste topic names, one per line:\nAlgebra\nCalculus\nGeometry"}
        rows={4}
        className="w-full rounded-md border border-border bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        disabled={adding}
      />
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {lines.length > 0
            ? `${lines.length} topic${lines.length === 1 ? "" : "s"} to add`
            : "Paste one topic per line"}
        </span>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={lines.length === 0 || adding}
          size="sm"
        >
          {adding ? "Adding..." : `Add ${lines.length > 0 ? lines.length : "topics"}`}
        </Button>
      </div>
    </div>
  );
}
