"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TopicItem } from "./topic-item";
import { createTopics, deleteTopics, reorderTopics, updateTopic } from "@/lib/actions/subjects";

type TopicListProps = {
  subjectId: string;
  initialTopics: Array<{
    id: string;
    title: string;
    sortOrder: number;
    status: string;
  }>;
  userId: string;
};

export function TopicList({ subjectId, initialTopics, userId }: TopicListProps) {
  const [topics, setTopics] = useState(initialTopics);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkText, setBulkText] = useState("");
  const [adding, setAdding] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const bulkLines = bulkText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const handleBulkAdd = useCallback(async () => {
    if (bulkLines.length === 0) return;
    setAdding(true);
    setBulkError(null);
    try {
      const { ids } = await createTopics(subjectId, bulkLines);
      const startOrder = topics.length > 0
        ? Math.max(...topics.map((t) => t.sortOrder)) + 1
        : 1;
      const newTopics = bulkLines.map((title, i) => ({
        id: ids[i] ?? "",
        title,
        sortOrder: startOrder + i,
        status: "pending" as const,
      }));
      setTopics((prev) => [...prev, ...newTopics]);
      setBulkText("");
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : "Failed to create topics");
    } finally {
      setAdding(false);
    }
  }, [subjectId, topics, bulkLines]);

  const handleRename = useCallback(async (topicId: string, title: string) => {
    await updateTopic(topicId, userId, { title });
    setTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, title } : t))
    );
  }, [userId]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectMode = useCallback(() => {
    setSelectMode((prev) => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  }, []);

  const handleBatchDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await deleteTopics(Array.from(selectedIds));
    setTopics((prev) => prev.filter((t) => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
  }, [selectedIds]);

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, sortOrder: number) => {
    setDragIndex(sortOrder);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, _sortOrder: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetSortOrder: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === targetSortOrder) return;

    const reordered = [...topics].sort((a, b) => a.sortOrder - b.sortOrder);
    const fromIdx = reordered.findIndex((t) => t.sortOrder === dragIndex);
    const toIdx = reordered.findIndex((t) => t.sortOrder === targetSortOrder);
    if (fromIdx === -1 || toIdx === -1) return;

    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    const newOrders = reordered.map((t, i) => ({ id: t.id, sortOrder: i + 1 }));
    await reorderTopics(subjectId, newOrders);
    setTopics(reordered.map((t, i) => ({ ...t, sortOrder: i + 1 })));
    setDragIndex(null);
  }, [dragIndex, subjectId, topics]);

  const sortedTopics = [...topics].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {topics.length} topic{topics.length === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-2">
        {selectMode ? (
          <>
            <Button variant="outline" size="sm" onClick={toggleSelectMode}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              disabled={selectedIds.size === 0}
            >
              Delete {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
            </Button>
            <span className="text-xs text-muted-foreground">
              {selectedIds.size} selected
            </span>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={toggleSelectMode}>
            Select
          </Button>
        )}
      </div>

      {sortedTopics.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No topics yet. Add some using the textarea below.
        </p>
      ) : (
        <div className="space-y-2">
          {sortedTopics.map((topic) => (
            <TopicItem
              key={topic.id}
              topic={topic}
              isSelected={selectedIds.has(topic.id)}
              onToggleSelect={toggleSelect}
              onRename={handleRename}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              selectMode={selectMode}
            />
          ))}
        </div>
      )}

      <hr className="border-border" />

      <div className="space-y-3">
        <Label htmlFor="bulk-topics">Add topics</Label>
        <textarea
          id="bulk-topics"
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={"Type or paste topic names, one per line:\nAlgebra\nCalculus\nGeometry"}
          rows={4}
          className="w-full rounded-md border border-border bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={adding}
        />
        {bulkError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{bulkError}</div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {bulkLines.length > 0
              ? `${bulkLines.length} topic${bulkLines.length === 1 ? "" : "s"} to add`
              : "Paste one topic per line"}
          </span>
          <Button
            type="button"
            onClick={handleBulkAdd}
            disabled={bulkLines.length === 0 || adding}
            size="sm"
          >
            {adding ? "Adding..." : `Add ${bulkLines.length > 0 ? bulkLines.length : "topics"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
