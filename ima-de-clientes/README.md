# Ímã de Clientes

Portal premium de captação e qualificação de leads por IA. Leads preenchem um
formulário; o agente Claude qualifica (nota + potencial) e gera um briefing
estruturado para a equipe. Next.js (App Router) + TypeScript + Tailwind CSS +
Supabase + Anthropic SDK.

## Como rodar

```bash
npm install
cp .env.example .env   # Supabase + ANTHROPIC_API_KEY
# rode supabase/schema.sql no SQL Editor do Supabase
npm run dev            # http://localhost:3000
```

- `/` — formulário público (visão do lead)
- `/dashboard` — painel interno da agência

## Estrutura

```
ima-de-clientes/
├─ app/
│  ├─ globals.css          # base Tailwind + estética dark
│  ├─ layout.tsx           # fonte, metadata, shell
│  ├─ page.tsx             # visão pública (formulário)
│  └─ dashboard/
│     └─ page.tsx          # visão interna (lista de leads)
├─ components/
│  ├─ lead-form/
│  │  └─ LeadForm.tsx      # formulário de captação
│  └─ dashboard/
│     └─ LeadCard.tsx      # card de lead (nota, potencial, briefing)
├─ lib/
│  └─ types.ts             # Lead, LeadInput, Briefing, status/potencial
└─ supabase/
   └─ schema.sql           # tabela `leads`
```

## Próximos passos (não incluídos neste scaffold)

- Rota `POST /api/leads`: recebe os dados brutos, chama o Claude para
  qualificar + gerar o briefing (JSON via structured outputs) e grava no Supabase.
- Dashboard lendo os leads reais do Supabase no lugar dos dados de demonstração.
- Download do briefing (PDF/Markdown) e fluxo de aprovação.
