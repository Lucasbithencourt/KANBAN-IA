import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * ===========================================================================
 * POST /api/kanban  —  Motor "Gerente de Operações Anti-Prejuízo"
 * ===========================================================================
 * Recebe a movimentação de uma tarefa e aplica a regra de controle de escopo:
 *
 *  1. Busca a tarefa e o projeto correspondente (com `limite_revisoes`).
 *  2. Se `novo_status === 'revisao'`, incrementa `total_revisoes_feitas`.
 *  3. Se o total exceder o limite do projeto, INTERCEPTA a ação:
 *       - força o status para 'bloqueado_escopo';
 *       - registra um log em `historico_movimentacoes`;
 *       - aciona a IA (Claude) para gerar a justificativa interna e a
 *         notificação para o cliente em JSON limpo.
 *  4. Retorna ao frontend um sinal (`bloqueado: true`) para renderizar o card
 *     com a borda de alerta âmbar/vermelha.
 * ===========================================================================
 */

// Executa no runtime Node (o SDK da Anthropic e a service role key exigem Node).
export const runtime = "nodejs";

const STATUS_REVISAO = "revisao" as const;
const STATUS_BLOQUEADO = "bloqueado_escopo" as const;

/** Payload esperado no corpo da requisição. */
interface MovimentacaoBody {
  tarefa_id: string;
  novo_status: string;
}

/** Linha da tabela `projetos`. */
interface Projeto {
  id: string;
  nome: string;
  cliente: string | null;
  limite_revisoes: number;
}

/** Linha da tabela `tarefas` (com o projeto embutido pelo join). */
interface Tarefa {
  id: string;
  projeto_id: string;
  titulo: string;
  descricao: string | null;
  responsavel: string | null;
  data_entrega: string | null;
  status: string;
  total_revisoes_feitas: number;
  historico_movimentacoes: MovimentacaoLog[];
  projetos: Projeto | null;
}

/** Entrada de auditoria gravada em `historico_movimentacoes`. */
interface MovimentacaoLog {
  timestamp: string;
  de_status: string;
  para_status: string;
  motivo: string;
  gerado_por_ia: boolean;
}

/** Formato JSON limpo que a IA deve devolver. */
interface AnaliseBloqueio {
  gravidade: "baixa" | "media" | "alta";
  justificativa_interna: string;
  notificacao_cliente: string;
  acao_recomendada: string;
}

// ---------------------------------------------------------------------------
// Cliente da IA (lê ANTHROPIC_API_KEY do ambiente automaticamente).
// ---------------------------------------------------------------------------
const anthropic = new Anthropic();

/**
 * Constrói e envia o prompt de engenharia para o Claude gerar a análise de
 * bloqueio. Usa structured outputs (`output_config.format`) para garantir um
 * JSON válido, sem preâmbulo nem cercas de código.
 */
async function gerarAnaliseBloqueio(
  tarefa: Tarefa,
  projeto: Projeto,
  totalRevisoes: number,
): Promise<AnaliseBloqueio> {
  const systemPrompt = [
    "Você é o 'Gerente de Operações Anti-Prejuízo' de uma agência digital premium.",
    "Sua função é proteger a margem da agência quando um projeto ultrapassa o número",
    "de revisões contratado (estouro de escopo).",
    "Escreva em português do Brasil, com tom profissional, sóbrio e direto.",
    "A justificativa interna é para o dono da agência (pode ser franca sobre prejuízo/risco).",
    "A notificação ao cliente deve ser cordial, empática e firme, deixando claro que",
    "revisões adicionais estão fora do escopo contratado e exigem novo acordo comercial,",
    "sem soar hostil. Não invente valores monetários nem prazos específicos.",
  ].join(" ");

  const userPrompt = [
    "Uma tarefa foi bloqueada automaticamente por estouro de escopo. Analise o contexto",
    "e gere a justificativa e a notificação de bloqueio.",
    "",
    `Projeto: ${projeto.nome}`,
    `Cliente: ${projeto.cliente ?? "não informado"}`,
    `Limite de revisões contratado: ${projeto.limite_revisoes}`,
    `Revisões já realizadas (após esta): ${totalRevisoes}`,
    "",
    `Tarefa: ${tarefa.titulo}`,
    `Descrição: ${tarefa.descricao ?? "sem descrição"}`,
    `Responsável: ${tarefa.responsavel ?? "não atribuído"}`,
  ].join("\n");

  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            gravidade: { type: "string", enum: ["baixa", "media", "alta"] },
            justificativa_interna: {
              type: "string",
              description: "Explicação do bloqueio para o dono da agência.",
            },
            notificacao_cliente: {
              type: "string",
              description: "Mensagem cordial e firme para enviar ao cliente.",
            },
            acao_recomendada: {
              type: "string",
              description: "Próximo passo prático sugerido ao gestor.",
            },
          },
          required: [
            "gravidade",
            "justificativa_interna",
            "notificacao_cliente",
            "acao_recomendada",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  // Com output_config.format, o primeiro bloco de texto é JSON válido.
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("A IA não retornou conteúdo de texto.");
  }
  return JSON.parse(textBlock.text) as AnaliseBloqueio;
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();

  // 1. Validação do corpo da requisição --------------------------------------
  let body: MovimentacaoBody;
  try {
    body = (await request.json()) as MovimentacaoBody;
  } catch {
    return NextResponse.json(
      { erro: "Corpo da requisição inválido (JSON esperado)." },
      { status: 400 },
    );
  }

  const { tarefa_id, novo_status } = body;
  if (!tarefa_id || !novo_status) {
    return NextResponse.json(
      { erro: "Campos obrigatórios: tarefa_id e novo_status." },
      { status: 400 },
    );
  }

  // 2. Busca a tarefa e o projeto correspondente -----------------------------
  const { data: tarefa, error: fetchError } = await supabase
    .from("tarefas")
    .select(
      "id, projeto_id, titulo, descricao, responsavel, data_entrega, status, total_revisoes_feitas, historico_movimentacoes, projetos(id, nome, cliente, limite_revisoes)",
    )
    .eq("id", tarefa_id)
    .single<Tarefa>();

  if (fetchError || !tarefa) {
    return NextResponse.json(
      { erro: "Tarefa não encontrada.", detalhe: fetchError?.message },
      { status: 404 },
    );
  }

  const projeto = tarefa.projetos;
  if (!projeto) {
    return NextResponse.json(
      { erro: "Projeto associado à tarefa não encontrado." },
      { status: 422 },
    );
  }

  const statusAnterior = tarefa.status;

  // 3. Regra de escopo: incrementa revisões e decide o bloqueio --------------
  const entrouEmRevisao = novo_status === STATUS_REVISAO;
  const totalRevisoes = entrouEmRevisao
    ? tarefa.total_revisoes_feitas + 1
    : tarefa.total_revisoes_feitas;

  const estourouEscopo =
    entrouEmRevisao && totalRevisoes > projeto.limite_revisoes;

  const historico = Array.isArray(tarefa.historico_movimentacoes)
    ? tarefa.historico_movimentacoes
    : [];

  // -- Caminho A: estouro de escopo → intercepta e bloqueia ------------------
  if (estourouEscopo) {
    let analise: AnaliseBloqueio;
    try {
      analise = await gerarAnaliseBloqueio(tarefa, projeto, totalRevisoes);
    } catch (err) {
      // Fallback: mesmo sem IA, o bloqueio precisa acontecer (fail-safe).
      analise = {
        gravidade: "alta",
        justificativa_interna:
          `Tarefa bloqueada: ${totalRevisoes} revisões realizadas contra um limite de ` +
          `${projeto.limite_revisoes} no projeto "${projeto.nome}". Análise da IA indisponível.`,
        notificacao_cliente:
          "Esta tarefa atingiu o número de revisões previsto em contrato. Revisões " +
          "adicionais precisam de um novo acordo comercial antes de prosseguirmos.",
        acao_recomendada:
          "Contatar o cliente para renegociar o escopo antes de retomar a tarefa.",
      };
      console.error("[api/kanban] Falha ao gerar análise de IA:", err);
    }

    const log: MovimentacaoLog = {
      timestamp: new Date().toISOString(),
      de_status: statusAnterior,
      para_status: STATUS_BLOQUEADO,
      motivo:
        `Estouro de escopo: ${totalRevisoes}/${projeto.limite_revisoes} revisões. ` +
        analise.justificativa_interna,
      gerado_por_ia: true,
    };

    const { data: atualizada, error: updateError } = await supabase
      .from("tarefas")
      .update({
        status: STATUS_BLOQUEADO,
        total_revisoes_feitas: totalRevisoes,
        historico_movimentacoes: [...historico, log],
      })
      .eq("id", tarefa_id)
      .select("id, status, total_revisoes_feitas")
      .single();

    if (updateError) {
      return NextResponse.json(
        { erro: "Falha ao bloquear a tarefa.", detalhe: updateError.message },
        { status: 500 },
      );
    }

    // Sinaliza ao frontend para pintar o card com a borda de alerta.
    return NextResponse.json(
      {
        bloqueado: true,
        tarefa: atualizada,
        status_aplicado: STATUS_BLOQUEADO,
        total_revisoes_feitas: totalRevisoes,
        limite_revisoes: projeto.limite_revisoes,
        analise,
        ui: {
          aplicar_borda_alerta: true,
          mensagem:
            "Tarefa bloqueada por estouro de escopo. Atualize o card com o alerta.",
        },
      },
      { status: 200 },
    );
  }

  // -- Caminho B: movimentação normal ---------------------------------------
  const log: MovimentacaoLog = {
    timestamp: new Date().toISOString(),
    de_status: statusAnterior,
    para_status: novo_status,
    motivo: entrouEmRevisao
      ? `Entrada em revisão (${totalRevisoes}/${projeto.limite_revisoes}).`
      : "Movimentação de status.",
    gerado_por_ia: false,
  };

  const { data: atualizada, error: updateError } = await supabase
    .from("tarefas")
    .update({
      status: novo_status,
      total_revisoes_feitas: totalRevisoes,
      historico_movimentacoes: [...historico, log],
    })
    .eq("id", tarefa_id)
    .select("id, status, total_revisoes_feitas")
    .single();

  if (updateError) {
    return NextResponse.json(
      { erro: "Falha ao atualizar a tarefa.", detalhe: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      bloqueado: false,
      tarefa: atualizada,
      status_aplicado: novo_status,
      total_revisoes_feitas: totalRevisoes,
      limite_revisoes: projeto.limite_revisoes,
      ui: { aplicar_borda_alerta: false },
    },
    { status: 200 },
  );
}
