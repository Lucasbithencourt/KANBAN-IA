import {
  Building2,
  CheckCircle2,
  Download,
  Mail,
  Sparkles,
} from "lucide-react";
import type { Lead, Potencial } from "@/lib/types";

interface LeadCardProps {
  lead: Lead;
}

const POTENCIAL_STYLE: Record<Potencial, string> = {
  alto: "border-emerald-500/25 bg-emerald-950/20 text-emerald-300",
  medio: "border-amber-500/25 bg-amber-950/20 text-amber-300",
  baixo: "border-zinc-600/30 bg-surface-raised text-zinc-400",
};

/** Cor da nota conforme a faixa (0–100). */
function notaStyle(nota: number | null): string {
  if (nota === null) return "border-line bg-surface-raised text-zinc-500";
  if (nota >= 75) return "border-emerald-500/25 bg-emerald-950/20 text-emerald-300";
  if (nota >= 45) return "border-amber-500/25 bg-amber-950/20 text-amber-300";
  return "border-red-500/25 bg-red-950/20 text-red-300";
}

export function LeadCard({ lead }: LeadCardProps) {
  return (
    <article className="animate-fade-in rounded-2xl border border-line bg-surface-card p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Building2 className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
            <span className="truncate">{lead.empresa}</span>
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
            <Mail className="h-3 w-3" aria-hidden />
            {lead.email}
          </p>
        </div>

        {/* Nota de qualificação da IA */}
        <div
          className={[
            "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border text-center",
            notaStyle(lead.nota_qualificacao),
          ].join(" ")}
          title="Nota de qualificação (IA)"
        >
          <span className="text-sm font-bold leading-none">
            {lead.nota_qualificacao ?? "—"}
          </span>
          <span className="text-[9px] opacity-70">nota</span>
        </div>
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-lg border border-line bg-surface-raised px-2 py-1 text-[11px] text-zinc-400">
          {lead.segmento}
        </span>
        {lead.potencial_fechamento && (
          <span
            className={[
              "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium",
              POTENCIAL_STYLE[lead.potencial_fechamento],
            ].join(" ")}
          >
            <Sparkles className="h-3 w-3" aria-hidden />
            Potencial {lead.potencial_fechamento}
          </span>
        )}
      </div>

      {/* Prévia do briefing gerado pela IA */}
      {lead.briefing ? (
        <div className="mt-4 rounded-xl border border-line-soft bg-surface-raised/60 p-3.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Briefing gerado
          </p>
          <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-zinc-300">
            {lead.briefing.objetivo_principal}
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-line-soft p-3.5 text-center text-[11px] text-zinc-600">
          Aguardando qualificação da IA…
        </div>
      )}

      <footer className="mt-4 flex items-center gap-2">
        <button
          type="button"
          disabled={!lead.briefing}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface-raised px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-surface-hover disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          Baixar briefing
        </button>
        <button
          type="button"
          disabled={!lead.briefing}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-900 transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Aprovar
        </button>
      </footer>
    </article>
  );
}
