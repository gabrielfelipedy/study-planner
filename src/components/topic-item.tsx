"use client";

import { InlineEdit } from "./inline-edit";

type TopicItemProps = {
  topic: { id: string; title: string; sortOrder: number };
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onRename: (topicId: string, title: string) => Promise<void>;
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
      className={`flex items-center gap-3 rounded-md border bg-white px-4 py-2.5 transition ${
        isSelected ? "border-violet-400 bg-violet-50" : "border-zinc-200"
      } ${!selectMode ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      {!selectMode && (
        <span className="text-zinc-400 select-none" aria-hidden="true">
          ⠿
        </span>
      )}

      {selectMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(topic.id)}
          className="h-4 w-4 rounded border-zinc-300 text-violet-600"
        />
      )}

      <div className="flex-1 min-w-0">
        <InlineEdit
          value={topic.title}
          onSave={(title) => onRename(topic.id, title)}
        />
      </div>
    </div>
  );
}
