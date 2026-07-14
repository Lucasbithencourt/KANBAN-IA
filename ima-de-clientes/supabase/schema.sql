-- ===========================================================================
-- Ímã de Clientes — schema PostgreSQL (Supabase)
-- Captura leads do formulário público e guarda a qualificação + briefing
-- gerados pela IA (Claude Opus).
-- ===========================================================================

create extension if not exists "pgcrypto";

-- status: 'novo' | 'qualificado' | 'briefing_gerado' | 'aprovado' | 'arquivado'
-- potencial: 'baixo' | 'medio' | 'alto'
create table if not exists public.leads (
  id                    uuid primary key default gen_random_uuid(),

  -- Dados brutos do formulário público
  empresa               text not null,
  site                  text,
  contato               text not null,
  email                 text not null,
  telefone              text,
  segmento              text not null,
  escopo                text not null,
  orcamento             text,
  prazo                 text,

  -- Preenchidos pela IA
  status                text not null default 'novo',
  nota_qualificacao     integer check (nota_qualificacao between 0 and 100),
  potencial_fechamento  text,
  briefing              jsonb,

  created_at            timestamptz not null default now()
);

create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_created on public.leads(created_at desc);
