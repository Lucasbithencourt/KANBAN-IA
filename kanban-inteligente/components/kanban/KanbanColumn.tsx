"use client";

import { useState } from "react";
import type { Column, Status, Task } from "@/lib/types";
import { BLOCKED_STATUS } from "@/lib/data";
import { TaskCard } from "./TaskCard";

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  /** Handler disparado quando um card é solto nesta coluna. */
  onDropTask: (taskId: string, novoStatus: Status) => void;
}

export function KanbanColumn({ column, tasks, onDropTask }: KanbanColumnProps) {
  const isBlocked = column.id === BLOCKED_STATUS;
  const [isOver, setIsOver] = useState(false);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsOver(false);
    const taskId = event.dataTransfer.getData("text/plain");
    if (taskId) onDropTask(taskId, column.id);
  };

  return (
    <section className="flex h-full w-72 shrink-0 flex-col">
      <header className="mb-3 flex items-start justify-between gap-2 px-1">
        <div className="min-w-0">
          <h2
            className={[
              "truncate text-[13px] font-semibold tracking-tight",
              isBlocked ? "text-amber-300/90" : "text-zinc-200",
            ].join(" ")}
          >
            {column.title}
          </h2>
          {column.hint && (
            <p className="mt-0.5 truncate text-[11px] text-zinc-500">
              {column.hint}
            </p>
          )}
        </div>
        <span className="mt-0.5 inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-md border border-line bg-surface-raised px-1.5 text-[11px] font-medium text-zinc-400">
          {tasks.length}
        </span>
      </header>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={handleDrop}
        className={[
          "flex flex-1 flex-col gap-2.5 rounded-xl border p-2.5 transition-colors duration-150",
          isBlocked
            ? "border-amber-500/15 bg-amber-950/[0.06]"
            : "border-line-soft bg-surface-raised/60",
          isOver ? "border-zinc-500/50 bg-surface-hover/60" : "",
        ].join(" ")}
      >
        {tasks.length > 0 ? (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-line-soft py-8 text-[11px] text-zinc-600">
            {isOver ? "Solte aqui" : "Sem tarefas"}
          </div>
        )}
      </div>
    </section>
  );
}
