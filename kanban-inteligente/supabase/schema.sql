-- ===========================================================================
-- Kanban Inteligente — schema PostgreSQL (Supabase)
-- Núcleo do diferencial: rastrear revisões por tarefa e bloquear a tarefa
-- automaticamente quando o limite de revisões do projeto for estourado.
-- ===========================================================================

-- Extensão para gerar UUIDs
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Projetos
-- ---------------------------------------------------------------------------
create table if not exists public.projetos (
  id                uuid primary key default gen_random_uuid(),
  nome              text not null,
  cliente           text,
  -- Regra de negócio central: quantas revisões o escopo contratado cobre.
  limite_revisoes   integer not null default 2 check (limite_revisoes >= 0),
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tarefas
-- ---------------------------------------------------------------------------
-- status possíveis (mantidos como texto para flexibilidade do fluxo):
--   'a_fazer' | 'em_producao' | 'revisao' | 'aguardando_cliente'
--   | 'bloqueado_escopo' | 'concluido'
create table if not exists public.tarefas (
  id                       uuid primary key default gen_random_uuid(),
  projeto_id               uuid not null references public.projetos(id) on delete cascade,
  titulo                   text not null,
  descricao                text,
  responsavel              text,
  data_entrega             date,
  status                   text not null default 'a_fazer',
  -- Contador incrementado a cada entrada em 'revisao'.
  total_revisoes_feitas    integer not null default 0 check (total_revisoes_feitas >= 0),
  -- Trilha de auditoria: cada movimentação vira um objeto no array.
  historico_movimentacoes  jsonb not null default '[]'::jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists idx_tarefas_projeto on public.tarefas(projeto_id);
create index if not exists idx_tarefas_status  on public.tarefas(status);

-- Mantém updated_at coerente em qualquer UPDATE.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tarefas_updated_at on public.tarefas;
create trigger trg_tarefas_updated_at
  before update on public.tarefas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Dados de exemplo (opcional — remova em produção)
-- ---------------------------------------------------------------------------
insert into public.projetos (id, nome, cliente, limite_revisoes)
values ('00000000-0000-0000-0000-000000000001', 'Landing UppPediatria', 'UppPediatria', 2)
on conflict (id) do nothing;

insert into public.tarefas (projeto_id, titulo, descricao, responsavel, data_entrega, status, total_revisoes_feitas)
values (
  '00000000-0000-0000-0000-000000000001',
  'Copy da home',
  'Revisão de tom de voz e consistência editorial.',
  'Camila S.',
  '2026-07-14',
  'em_producao',
  2
)
on conflict do nothing;
