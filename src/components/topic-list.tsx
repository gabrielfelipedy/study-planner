"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
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

  const handleBulkAdd = useCallback(async (_subjectId: string, titles: string[]) => {
    const { ids } = await createTopics(subjectId, titles);
    const startOrder = topics.length > 0
      ? Math.max(...topics.map((t) => t.sortOrder)) + 1
      : 1;
    const newTopics = titles.map((title, i) => ({
      id: ids[i] ?? "",
      title,
      sortOrder: startOrder + i,
      status: "pending" as const,
    }));
    setTopics((prev) => [...prev, ...newTopics]);
  }, [subjectId, topics]);

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
            <span className="text-xs text-zinc-500">
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
        <p className="py-8 text-center text-sm text-zinc-500">
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
    </div>
  );
}
