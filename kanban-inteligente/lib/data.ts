import type { Column } from "./types";

/**
 * Colunas fixas do fluxo da agência.
 * A ordem aqui define a ordem horizontal no board e os `id` são exatamente
 * os status persistidos no banco (supabase/schema.sql).
 */
export const COLUMNS: Column[] = [
  { id: "a_fazer", title: "A Fazer", hint: "Backlog priorizado" },
  { id: "em_producao", title: "Em Produção", hint: "Execução ativa" },
  { id: "revisao", title: "Revisão Interna", hint: "Controle de qualidade" },
  { id: "aguardando_cliente", title: "Aguardando Cliente", hint: "Validação externa" },
  { id: "bloqueado_escopo", title: "Bloqueado (Estouro de Escopo)", hint: "Requer decisão do gestor" },
  { id: "concluido", title: "Concluído", hint: "Entregue e aprovado" },
];

/** Status que dispara o tratamento visual de alerta no card. */
export const BLOCKED_STATUS = "bloqueado_escopo" as const;
