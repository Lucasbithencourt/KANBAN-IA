"use client";

import { AlertTriangle, CalendarDays, User } from "lucide-react";
import type { Task } from "@/lib/types";
import { BLOCKED_STATUS } from "@/lib/data";

interface TaskCardProps {
  task: Task;
}

/** Formata YYYY-MM-DD para um rótulo curto pt-BR (ex.: 18 jul). */
function formatDueDate(iso: string | null): string {
  if (!iso) return "sem data";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .replace(".", "");
}

export function TaskCard({ task }: TaskCardProps) {
  const isBlocked = task.status === BLOCKED_STATUS;

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={[
        "group animate-fade-in cursor-grab rounded-xl border p-3.5 transition-all duration-200 active:cursor-grabbing",
        isBlocked
          ? // Regra de UI especial: alerta discreto para o gestor
            "border-amber-500/25 bg-amber-950/10 opacity-95 hover:border-amber-500/40 hover:bg-amber-950/20"
          : "border-line bg-surface-card hover:border-line hover:bg-surface-hover",
      ].join(" ")}
    >
      <header className="mb-1.5 flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium leading-snug text-zinc-100">
          {task.titulo}
        </h3>
        {isBlocked && (
          <span
            title="Estouro de escopo — requer atenção do gestor"
            className="mt-0.5 shrink-0 text-amber-400/90"
          >
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">Bloqueado por estouro de escopo</span>
          </span>
        )}
      </header>

      {task.descricao && (
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-zinc-400">
          {task.descricao}
        </p>
      )}

      <footer className="flex items-center justify-between gap-2">
        {/* Badge do responsável */}
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-raised px-2 py-1 text-[11px] font-medium text-zinc-300">
          <User className="h-3 w-3 text-zinc-500" aria-hidden />
          {task.responsavel ?? "—"}
        </span>

        {/* Badge da data de entrega */}
        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium",
            isBlocked
              ? "border-amber-500/25 bg-amber-950/20 text-amber-300/90"
              : "border-line bg-surface-raised text-zinc-400",
          ].join(" ")}
        >
          <CalendarDays className="h-3 w-3 opacity-70" aria-hidden />
          {formatDueDate(task.data_entrega)}
        </span>
      </footer>
    </article>
  );
}
