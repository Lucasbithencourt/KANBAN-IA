"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { MovimentacaoResponse, Status, Task } from "@/lib/types";
import { BLOCKED_STATUS, COLUMNS } from "@/lib/data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { KanbanColumn } from "./KanbanColumn";
import { TaskFormModal } from "./TaskFormModal";

/** Colunas usadas no SELECT do Supabase (nomes exatos da tabela `tarefas`). */
const TAREFA_COLUMNS =
  "id, status, titulo, descricao, responsavel, data_entrega, total_revisoes_feitas";

/**
 * Container principal do board.
 * - Carrega as tarefas reais do Supabase no mount.
 * - Gerencia o estado e agrupa por coluna.
 * - Ao mover um card (drag & drop): atualiza otimisticamente, chama a API de
 *   IA e reconcilia com a resposta (inclusive o bloqueio por estouro de escopo).
 */
export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  // Insere a tarefa recém-criada no board (aparece em 'a_fazer' na hora).
  const handleCreated = useCallback((tarefa: Task) => {
    setTasks((prev) => [...prev, tarefa]);
  }, []);

  // --- Carregamento inicial a partir do banco --------------------------------
  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("tarefas")
          .select(TAREFA_COLUMNS)
          .order("created_at", { ascending: true });

        if (error) throw error;
        if (ativo) setTasks((data as Task[]) ?? []);
      } catch (err) {
        if (ativo) {
          setErro(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar as tarefas.",
          );
        }
      } finally {
        if (ativo) setLoading(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, []);

  const tasksByColumn = useMemo(() => {
    const map = new Map<Status, Task[]>();
    for (const column of COLUMNS) map.set(column.id, []);
    for (const task of tasks) map.get(task.status)?.push(task);
    return map;
  }, [tasks]);

  // --- Movimentação de um card ----------------------------------------------
  const moveTask = useCallback(
    async (taskId: string, novoStatus: Status) => {
      const anterior = tasks.find((t) => t.id === taskId);
      if (!anterior || anterior.status === novoStatus) return;

      setErro(null);
      setAviso(null);

      // 1. Atualização otimista imediata.
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: novoStatus } : t)),
      );

      try {
        // 2. Dispara a rota de IA.
        const res = await fetch("/api/kanban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tarefa_id: taskId, novo_status: novoStatus }),
        });

        if (!res.ok) {
          const corpo = await res.json().catch(() => ({}));
          throw new Error(corpo?.erro ?? `Erro ${res.status} ao mover a tarefa.`);
        }

        const data = (await res.json()) as MovimentacaoResponse;

        // 3. Reconcilia com a resposta (fonte da verdade).
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: data.status_aplicado,
                  total_revisoes_feitas: data.total_revisoes_feitas,
                }
              : t,
          ),
        );

        // 4. Bloqueio por estouro de escopo → card já vai para a coluna
        //    'bloqueado_escopo' (via status_aplicado) e sinalizamos ao gestor.
        if (data.bloqueado && data.ui.aplicar_borda_alerta) {
          setAviso(
            data.analise
              ? `Tarefa bloqueada (${data.total_revisoes_feitas}/${data.limite_revisoes} revisões): ${data.analise.justificativa_interna}`
              : "Tarefa bloqueada por estouro de escopo.",
          );
        }
      } catch (err) {
        // Reverte a atualização otimista em caso de falha.
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: anterior.status } : t,
          ),
        );
        setErro(
          err instanceof Error ? err.message : "Falha ao mover a tarefa.",
        );
      }
    },
    [tasks],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Carregando tarefas…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex shrink-0 items-center justify-end">
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface-raised px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-surface-hover"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Nova Tarefa
        </button>
      </div>

      {(erro || aviso) && (
        <div
          className={[
            "mb-3 shrink-0 rounded-lg border px-3 py-2 text-xs",
            erro
              ? "border-red-500/25 bg-red-950/20 text-red-300"
              : "border-amber-500/25 bg-amber-950/20 text-amber-300",
          ].join(" ")}
        >
          {erro ?? aviso}
        </div>
      )}

      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByColumn.get(column.id) ?? []}
            onDropTask={moveTask}
          />
        ))}
      </div>

      <TaskFormModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

export { BLOCKED_STATUS };
