import Link from "next/link";
import { LeadCard } from "@/components/dashboard/LeadCard";
import type { Lead } from "@/lib/types";

/**
 * Dados de DEMONSTRAÇÃO para revisar a interface do dashboard.
 * Serão substituídos por leitura real do Supabase quando o agente de IA
 * (rota /api/leads) estiver ligado.
 */
const LEADS_DEMO: Lead[] = [
  {
    id: "demo-1",
    empresa: "Clínica Vitalis",
    site: "https://vitalis.com.br",
    contato: "Dra. Helena Rocha",
    email: "helena@vitalis.com.br",
    telefone: "(11) 90000-0000",
    segmento: "Saúde",
    escopo:
      "Reformular o site e criar um portal de agendamento com integração ao prontuário.",
    orcamento: "R$ 40.000 – R$ 60.000",
    prazo: "90 dias",
    status: "briefing_gerado",
    nota_qualificacao: 88,
    potencial_fechamento: "alto",
    briefing: {
      objetivo_principal:
        "Modernizar a presença digital da clínica e reduzir faltas com agendamento online integrado ao prontuário.",
      publico_alvo: "Pacientes 30–60 anos da região metropolitana.",
      funcionalidades_chave: [
        "Portal de agendamento",
        "Integração com prontuário",
        "Site institucional novo",
      ],
      desafios_tecnicos:
        "Integração com o sistema de prontuário legado e conformidade com dados sensíveis de saúde.",
    },
    created_at: "2026-07-12T10:00:00Z",
  },
  {
    id: "demo-2",
    empresa: "Loja Norte",
    site: null,
    contato: "Marcos Lima",
    email: "marcos@lojanorte.com",
    telefone: null,
    segmento: "E-commerce",
    escopo: "Quero um site de vendas simples e barato o quanto antes.",
    orcamento: "Até R$ 5.000",
    prazo: "15 dias",
    status: "qualificado",
    nota_qualificacao: 34,
    potencial_fechamento: "baixo",
    briefing: null,
    created_at: "2026-07-13T09:20:00Z",
  },
];

export default function DashboardPage() {
  const leads = LEADS_DEMO;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
            Leads recebidos
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Qualificação e briefings gerados automaticamente pela IA.
          </p>
        </div>
        <Link
          href="/"
          className="shrink-0 text-[11px] text-zinc-600 transition-colors hover:text-zinc-400"
        >
          ← Formulário público
        </Link>
      </header>

      {leads.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line py-20 text-center text-sm text-zinc-600">
          Nenhum lead ainda.
        </div>
      )}
    </main>
  );
}
