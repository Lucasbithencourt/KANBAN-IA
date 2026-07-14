import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Briefing, LeadInput, Potencial } from "@/lib/types";

/**
 * ===========================================================================
 * POST /api/leads  —  Agente de Triagem e Qualificação
 * ===========================================================================
 * Recebe os dados brutos do formulário público (LeadInput) e:
 *   1. Chama o Claude Opus atuando como Diretor Comercial/Operações Sênior.
 *   2. Obtém um JSON estruturado (nota, potencial, briefing).
 *   3. Persiste o lead completo na tabela `leads` do Supabase.
 *   4. Fail-safe: se a IA falhar, salva mesmo assim com nota padrão e
 *      briefing temporário — nunca perdemos o contato do cliente.
 * ===========================================================================
 */

// Runtime Node: o SDK da Anthropic e a service role key exigem Node.
export const runtime = "nodejs";

/** Retorno estruturado esperado da IA (schema exato solicitado). */
interface QualificacaoIA {
  nota_qualificacao: number;
  potencial_fechamento: Potencial;
  briefing: Briefing;
}

const anthropic = new Anthropic();

/** Campos obrigatórios do formulário. */
const CAMPOS_OBRIGATORIOS: (keyof LeadInput)[] = [
  "empresa",
  "contato",
  "email",
  "segmento",
  "escopo",
];

/**
 * Constrói o prompt e chama o Claude para qualificar o lead e gerar o
 * briefing. Usa structured outputs para garantir JSON válido e limpo.
 */
async function qualificarLead(lead: LeadInput): Promise<QualificacaoIA> {
  const systemPrompt = [
    "Você é o Diretor Comercial e de Operações Sênior de uma agência digital premium.",
    "Sua função é triar leads recebidos: avaliar a qualidade do pedido e preparar um",
    "briefing maduro para a equipe. Seja criterioso e realista.",
    "",
    "Regras de pontuação (nota_qualificacao, 0 a 100):",
    "- Clareza do escopo: pedidos vagos ('site simples e barato') pontuam baixo;",
    "  pedidos detalhados e com objetivo claro pontuam alto.",
    "- Compatibilidade de orçamento: orçamento coerente com o escopo pontua alto;",
    "  orçamento irrisório para um projeto complexo, ou prazo irreal, derruba a nota.",
    "",
    "potencial_fechamento: 'alto' | 'medio' | 'baixo', refletindo a probabilidade",
    "real de virar cliente considerando fit, orçamento e maturidade do pedido.",
    "",
    "Escreva o briefing em português do Brasil, objetivo e profissional.",
    "Não invente dados que o lead não forneceu; infira com prudência quando necessário.",
  ].join("\n");

  const userPrompt = [
    "Analise o lead abaixo e gere a qualificação.",
    "",
    `Empresa: ${lead.empresa}`,
    `Site: ${lead.site ?? "não informado"}`,
    `Contato: ${lead.contato}`,
    `Segmento: ${lead.segmento}`,
    `Orçamento: ${lead.orcamento ?? "não informado"}`,
    `Prazo: ${lead.prazo ?? "não informado"}`,
    "",
    "Escopo descrito pelo lead:",
    lead.escopo,
  ].join("\n");

  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1500,
    thinking: { type: "adaptive" },
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            nota_qualificacao: {
              type: "integer",
              minimum: 0,
              maximum: 100,
              description:
                "Nota de 0 a 100 pela clareza do escopo e compatibilidade de orçamento.",
            },
            potencial_fechamento: {
              type: "string",
              enum: ["alto", "medio", "baixo"],
            },
            briefing: {
              type: "object",
              properties: {
                objetivo_principal: { type: "string" },
                publico_alvo: { type: "string" },
                funcionalidades_chave: {
                  type: "array",
                  items: { type: "string" },
                },
                desafios_tecnicos: { type: "string" },
              },
              required: [
                "objetivo_principal",
                "publico_alvo",
                "funcionalidades_chave",
                "desafios_tecnicos",
              ],
              additionalProperties: false,
            },
          },
          required: [
            "nota_qualificacao",
            "potencial_fechamento",
            "briefing",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("A IA não retornou conteúdo de texto.");
  }
  return JSON.parse(textBlock.text) as QualificacaoIA;
}

/** Qualificação de fallback quando a IA está indisponível. */
function qualificacaoFallback(lead: LeadInput): QualificacaoIA {
  return {
    nota_qualificacao: 50,
    potencial_fechamento: "medio",
    briefing: {
      objetivo_principal:
        `Projeto para ${lead.empresa} (${lead.segmento}). Escopo informado: ` +
        `${lead.escopo.slice(0, 200)}${lead.escopo.length > 200 ? "…" : ""}`,
      publico_alvo: "A definir na reunião de descoberta.",
      funcionalidades_chave: ["A detalhar com o cliente"],
      desafios_tecnicos:
        "Qualificação automática indisponível — revisar manualmente.",
    },
  };
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();

  // 1. Validação do corpo ----------------------------------------------------
  let lead: LeadInput;
  try {
    lead = (await request.json()) as LeadInput;
  } catch {
    return NextResponse.json(
      { erro: "Corpo da requisição inválido (JSON esperado)." },
      { status: 400 },
    );
  }

  const faltando = CAMPOS_OBRIGATORIOS.filter((c) => !lead?.[c]?.trim?.());
  if (faltando.length > 0) {
    return NextResponse.json(
      { erro: `Campos obrigatórios ausentes: ${faltando.join(", ")}.` },
      { status: 400 },
    );
  }

  // 2. Qualificação pela IA (com fail-safe) ----------------------------------
  let qualificacao: QualificacaoIA;
  let iaOk = true;
  try {
    qualificacao = await qualificarLead(lead);
  } catch (err) {
    iaOk = false;
    qualificacao = qualificacaoFallback(lead);
    console.error("[api/leads] Falha na qualificação por IA:", err);
  }

  // 3. Persistência no Supabase ----------------------------------------------
  const { data, error } = await supabase
    .from("leads")
    .insert({
      empresa: lead.empresa,
      site: lead.site || null,
      contato: lead.contato,
      email: lead.email,
      telefone: lead.telefone || null,
      segmento: lead.segmento,
      escopo: lead.escopo,
      orcamento: lead.orcamento || null,
      prazo: lead.prazo || null,
      status: iaOk ? "briefing_gerado" : "novo",
      nota_qualificacao: qualificacao.nota_qualificacao,
      potencial_fechamento: qualificacao.potencial_fechamento,
      briefing: qualificacao.briefing,
    })
    .select("id, status, nota_qualificacao, potencial_fechamento")
    .single();

  if (error) {
    return NextResponse.json(
      { erro: "Falha ao salvar o lead.", detalhe: error.message },
      { status: 500 },
    );
  }

  // 4. Resposta --------------------------------------------------------------
  return NextResponse.json(
    {
      ok: true,
      qualificado_por_ia: iaOk,
      lead: data,
      nota_qualificacao: qualificacao.nota_qualificacao,
      potencial_fechamento: qualificacao.potencial_fechamento,
      briefing: qualificacao.briefing,
    },
    { status: 201 },
  );
}
