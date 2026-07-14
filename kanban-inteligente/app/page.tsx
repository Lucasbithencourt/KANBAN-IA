import { KanbanBoard } from "@/components/kanban/KanbanBoard";

export default function Home() {
  return (
    <main className="flex h-screen flex-col">
      <header className="shrink-0 border-b border-line-soft px-6 py-5">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-zinc-100">
              Kanban Inteligente
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              Fluxo de produção da agência — precisão e contemplação.
            </p>
          </div>
          <span className="hidden items-center gap-2 rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-[11px] font-medium text-zinc-400 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            Ambiente de demonstração
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 px-6 pt-6">
        <div className="mx-auto h-full max-w-[1600px]">
          <KanbanBoard />
        </div>
      </div>
    </main>
  );
}
