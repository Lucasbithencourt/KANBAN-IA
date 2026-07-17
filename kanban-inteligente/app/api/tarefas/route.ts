import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/types";

/**
 * ===========================================================================
 * POST /api/tarefas  —  Cria uma nova tarefa no board
 * ===========================================================================
 * Recebe os dados do formulário e insere na tabela `tarefas`. A tarefa nasce
 * sempre em 'a_fazer', com 0 revisões e histórico vazio. Roda no servidor com
 * a service role key (mesma arquitetura da rota /api/kanban).
 * ===========================================================================
 */

export const runtime = "nodejs";

/** Campos que a interface envia ao criar uma tarefa. */
interface NovaTarefaBody {
  titulo: string;
  descricao?: string | null;
  responsavel?: string | null;
  projeto_id: string;
  data_entrega?: string | null;
}

/** Colunas devolvidas — idênticas às que o board consome. */
const TAREFA_COLUMNS =
  "id, status, titulo, descricao, responsavel, data_entrega, total_revisoes_feitas";

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();

  // 1. Validação do corpo ----------------------------------------------------
  let body: NovaTarefaBody;
  try {
    body = (await request.json()) as NovaTarefaBody;
  } catch {
    return NextResponse.json(
      { erro: "Corpo da requisição inválido (JSON esperado)." },
      { status: 400 },
    );
  }

  const titulo = body.titulo?.trim();
  const projetoId = body.projeto_id?.trim();
  if (!titulo || !projetoId) {
    return NextResponse.json(
      { erro: "Campos obrigatórios: titulo e projeto_id." },
      { status: 400 },
    );
  }

  // 2. Inserção --------------------------------------------------------------
  const { data, error } = await supabase
    .from("tarefas")
    .insert({
      projeto_id: projetoId,
      titulo,
      descricao: body.descricao?.trim() || null,
      responsavel: body.responsavel?.trim() || null,
      data_entrega: body.data_entrega?.trim() || null,
      status: "a_fazer",
      total_revisoes_feitas: 0,
      historico_movimentacoes: [],
    })
    .select(TAREFA_COLUMNS)
    .single<Task>();

  if (error || !data) {
    return NextResponse.json(
      { erro: "Falha ao criar a tarefa.", detalhe: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ tarefa: data }, { status: 201 });
}
