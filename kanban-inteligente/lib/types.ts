/**
 * Tipos centrais do Kanban Inteligente.
 * Alinhados 1:1 com o schema PostgreSQL (supabase/schema.sql) e com a API
 * (app/api/kanban/route.ts) — os mesmos status em todas as camadas.
 */

/** Status de uma tarefa — idênticos aos valores gravados no banco. */
export type Status =
  | "a_fazer"
  | "em_producao"
  | "revisao"
  | "aguardando_cliente"
  | "bloqueado_escopo"
  | "concluido";

/** Metadados de exibição de uma coluna do board. */
export interface Column {
  id: Status;
  title: string;
  /** Descrição curta opcional exibida sob o título. */
  hint?: string;
}

/** Opção de projeto para o dropdown de criação de tarefa. */
export interface ProjetoOption {
  id: string;
  nome: string;
}

/**
 * Uma tarefa individual. Os nomes de campo espelham a tabela `tarefas`
 * para manter a tipagem consistente de ponta a ponta.
 */
export interface Task {
  id: string;
  status: Status;
  titulo: string;
  descricao: string | null;
  responsavel: string | null;
  /** Data de entrega no formato ISO (YYYY-MM-DD). */
  data_entrega: string | null;
  total_revisoes_feitas: number;
}

/**
 * Resposta de POST /api/kanban. Espelha o payload devolvido pelo Route
 * Handler para que o front consuma sem `any`.
 */
export interface MovimentacaoResponse {
  bloqueado: boolean;
  tarefa: {
    id: string;
    status: Status;
    total_revisoes_feitas: number;
  };
  status_aplicado: Status;
  total_revisoes_feitas: number;
  limite_revisoes: number;
  analise?: {
    gravidade: "baixa" | "media" | "alta";
    justificativa_interna: string;
    notificacao_cliente: string;
    acao_recomendada: string;
  };
  ui: {
    aplicar_borda_alerta: boolean;
    mensagem?: string;
  };
}
