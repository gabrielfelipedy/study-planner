"use client";

import { InlineEdit } from "./inline-edit";
import { Trash2 } from "lucide-react";

type TopicItemProps = {
  topic: { id: string; title: string; sortOrder: number };
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onRename: (topicId: string, title: string) => Promise<void>;
  onDelete?: (topicId: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  selectMode: boolean;
};

export function TopicItem({
  topic,
  isSelected,
  onToggleSelect,
  onRename,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  selectMode,
}: TopicItemProps) {
  return (
    <div
      draggable={!selectMode}
      onDragStart={(e) => onDragStart(e, topic.sortOrder)}
      onDragOver={(e) => onDragOver(e, topic.sortOrder)}
      onDrop={(e) => onDrop(e, topic.sortOrder)}
      className={`group flex items-center gap-3 rounded-md border bg-card px-4 py-2.5 transition ${
        isSelected ? "border-primary bg-accent" : "border-border"
      } ${!selectMode ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      {!selectMode && (
        <span className="text-muted-foreground select-none" aria-hidden="true">
          ⠿
        </span>
      )}

      {selectMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(topic.id)}
          className="h-4 w-4 rounded border-border text-primary"
        />
      )}

      <div className="flex-1 min-w-0">
        <InlineEdit
          value={topic.title}
          onSave={(title) => onRename(topic.id, title)}
        />
      </div>

      {!selectMode && onDelete && (
        <button
          type="button"
          onClick={() => onDelete(topic.id)}
          className="shrink-0 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
          title="Delete topic"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
