/**
 * Tipos centrais do Ímã de Clientes.
 * Alinhados com o schema PostgreSQL (supabase/schema.sql).
 */

/** Estágio do lead no funil da agência. */
export type LeadStatus =
  | "novo"
  | "qualificado"
  | "briefing_gerado"
  | "aprovado"
  | "arquivado";

/** Potencial de fechamento estimado pela IA. */
export type Potencial = "baixo" | "medio" | "alto";

/** Dados brutos enviados pelo lead no formulário público. */
export interface LeadInput {
  empresa: string;
  site: string | null;
  contato: string;
  email: string;
  telefone: string | null;
  segmento: string;
  escopo: string;
  orcamento: string | null;
  prazo: string | null;
}

/**
 * Briefing estruturado gerado pela IA a partir dos dados brutos.
 * Formato JSON limpo, pronto para exibição e download.
 */
export interface Briefing {
  objetivo_principal: string;
  publico_alvo: string;
  funcionalidades_chave: string[];
  desafios_tecnicos: string;
}

/** Registro completo de um lead na tabela `leads`. */
export interface Lead extends LeadInput {
  id: string;
  status: LeadStatus;
  /** Nota de qualificação atribuída pela IA (0–100). */
  nota_qualificacao: number | null;
  potencial_fechamento: Potencial | null;
  briefing: Briefing | null;
  created_at: string;
}
