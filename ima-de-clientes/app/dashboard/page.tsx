import Link from "next/link";
import { LeadCard } from "@/components/dashboard/LeadCard";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/types";

// Sempre renderiza no request (lista de leads muda a cada envio).
export const dynamic = "force-dynamic";

/** Busca os leads reais no Supabase, dos mais recentes para os mais antigos. */
async function carregarLeads(): Promise<{ leads: Lead[]; erro: string | null }> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return { leads: [], erro: error.message };
    return { leads: (data as Lead[]) ?? [], erro: null };
  } catch (err) {
    return {
      leads: [],
      erro:
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os leads.",
    };
  }
}

export default async function DashboardPage() {
  const { leads, erro } = await carregarLeads();

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
            Leads recebidos
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Qualificação e briefings gerados automaticamente pela IA.
            {leads.length > 0 && (
              <span className="text-zinc-600"> · {leads.length} no total</span>
            )}
          </p>
        </div>
        <Link
          href="/"
          className="shrink-0 text-[11px] text-zinc-600 transition-colors hover:text-zinc-400"
        >
          ← Formulário público
        </Link>
      </header>

      {erro ? (
        <div className="rounded-2xl border border-red-500/25 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          Falha ao carregar os leads: {erro}
        </div>
      ) : leads.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line py-20 text-center text-sm text-zinc-600">
          Nenhum lead ainda. Assim que um projeto for enviado pelo formulário
          público, ele aparece aqui.
        </div>
      )}
    </main>
  );
}
