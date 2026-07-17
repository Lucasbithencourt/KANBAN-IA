"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2, Plus, X } from "lucide-react";
import type { ProjetoOption, Task } from "@/lib/types";

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Chamado com a tarefa recém-criada (já persistida no banco). */
  onCreated: (task: Task) => void;
}

const CAMPO_BASE =
  "w-full rounded-xl border border-line bg-surface-raised px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-500/60";

interface FormState {
  titulo: string;
  descricao: string;
  responsavel: string;
  projeto_id: string;
  data_entrega: string;
}

const estadoInicial: FormState = {
  titulo: "",
  descricao: "",
  responsavel: "",
  projeto_id: "",
  data_entrega: "",
};

export function TaskFormModal({ open, onClose, onCreated }: TaskFormModalProps) {
  const [form, setForm] = useState<FormState>(estadoInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [projetos, setProjetos] = useState<ProjetoOption[]>([]);
  const [carregandoProjetos, setCarregandoProjetos] = useState(false);
  const [erroProjetos, setErroProjetos] = useState<string | null>(null);

  // Fecha com a tecla Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Ao abrir: reseta o formulário e busca a lista de projetos.
  useEffect(() => {
    if (!open) return;

    setForm(estadoInicial);
    setErro(null);
    setErroProjetos(null);
    setCarregandoProjetos(true);

    let ativo = true;
    (async () => {
      try {
        const res = await fetch("/api/projetos");
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        const { projetos } = (await res.json()) as { projetos: ProjetoOption[] };
        if (ativo) setProjetos(projetos ?? []);
      } catch {
        if (ativo) setErroProjetos("Não foi possível carregar os projetos.");
      } finally {
        if (ativo) setCarregandoProjetos(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [open]);

  if (!open) return null;

  const set = (campo: keyof FormState) => (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  // Só libera o "Criar tarefa" com projetos carregados, um projeto válido
  // selecionado e um título preenchido.
  const podeEnviar =
    !salvando &&
    !carregandoProjetos &&
    projetos.length > 0 &&
    form.projeto_id !== "" &&
    form.titulo.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/tarefas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const corpo = await res.json().catch(() => ({}));
        throw new Error(corpo?.erro ?? `Erro ${res.status} ao criar a tarefa.`);
      }

      const { tarefa } = (await res.json()) as { tarefa: Task };
      onCreated(tarefa);
      onClose();
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : "Não foi possível criar a tarefa.",
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nova tarefa"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        // Fecha ao clicar fora do painel.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-fade-in w-full max-w-md rounded-2xl border border-line bg-surface-card p-6 shadow-2xl">
        <header className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">Nova tarefa</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-surface-hover hover:text-zinc-300"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Campo label="Título" obrigatorio>
            <input
              required
              autoFocus
              value={form.titulo}
              onChange={set("titulo")}
              placeholder="Ex.: Wireframe da home"
              className={CAMPO_BASE}
            />
          </Campo>

          <Campo label="Descrição">
            <textarea
              value={form.descricao}
              onChange={set("descricao")}
              rows={3}
              placeholder="Contexto curto da tarefa."
              className={`${CAMPO_BASE} resize-none`}
            />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Responsável">
              <input
                value={form.responsavel}
                onChange={set("responsavel")}
                placeholder="Nome"
                className={CAMPO_BASE}
              />
            </Campo>
            <Campo label="Data de entrega">
              <input
                type="date"
                value={form.data_entrega}
                onChange={set("data_entrega")}
                className={`${CAMPO_BASE} [color-scheme:dark]`}
              />
            </Campo>
          </div>

          <Campo label="Projeto" obrigatorio>
            {carregandoProjetos ? (
              <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-raised px-3.5 py-2.5 text-xs text-zinc-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Carregando projetos…
              </div>
            ) : erroProjetos ? (
              <p className="rounded-xl border border-red-500/25 bg-red-950/20 px-3.5 py-2.5 text-xs text-red-300">
                {erroProjetos}
              </p>
            ) : projetos.length === 0 ? (
              <p className="rounded-xl border border-line bg-surface-raised px-3.5 py-2.5 text-xs text-zinc-500">
                Nenhum projeto cadastrado ainda.
              </p>
            ) : (
              <div className="relative">
                <select
                  required
                  value={form.projeto_id}
                  onChange={set("projeto_id")}
                  className={`${CAMPO_BASE} appearance-none pr-9 [color-scheme:dark]`}
                >
                  <option value="" disabled>
                    Selecione um projeto
                  </option>
                  {projetos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                  aria-hidden
                />
              </div>
            )}
          </Campo>

          {erro && (
            <p className="rounded-lg border border-red-500/25 bg-red-950/20 px-3 py-2 text-xs text-red-300">
              {erro}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line bg-surface-raised px-3.5 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-surface-hover"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!podeEnviar}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3.5 py-2 text-xs font-semibold text-zinc-900 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {salvando ? "Salvando…" : "Criar tarefa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Campo({
  label,
  obrigatorio,
  children,
}: {
  label: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-zinc-400">
        {label}
        {obrigatorio && <span className="ml-0.5 text-zinc-600">*</span>}
      </span>
      {children}
    </label>
  );
}
