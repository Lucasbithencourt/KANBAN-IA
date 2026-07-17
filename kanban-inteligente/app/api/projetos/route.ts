import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ProjetoOption } from "@/lib/types";

/**
 * ===========================================================================
 * GET /api/projetos  —  Lista de projetos para o dropdown de criação
 * ===========================================================================
 * Retorna apenas `id` e `nome`, ordenados por nome. Roda no servidor com a
 * service role key (não depende de RLS liberada para a anon key).
 * ===========================================================================
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("projetos")
    .select("id, nome")
    .order("nome", { ascending: true });

  if (error) {
    return NextResponse.json(
      { erro: "Falha ao carregar os projetos.", detalhe: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ projetos: (data as ProjetoOption[]) ?? [] });
}
