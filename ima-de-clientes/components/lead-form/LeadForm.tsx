"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import type { LeadInput } from "@/lib/types";

const CAMPO_BASE =
  "w-full rounded-xl border border-line bg-surface-raised px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-500/60";

const estadoInicial: LeadInput = {
  empresa: "",
  site: "",
  contato: "",
  email: "",
  telefone: "",
  segmento: "",
  escopo: "",
  orcamento: "",
  prazo: "",
};

/**
 * Formulário público de captação de leads.
 * No submit, envia os dados brutos para a API (o agente de IA qualifica e
 * gera o briefing no backend). A integração de rede será ligada no próximo
 * passo — aqui o scaffold já entrega o estado de envio/sucesso/erro.
 */
export function LeadForm() {
  const [form, setForm] = useState<LeadInput>(estadoInicial);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const set = (campo: keyof LeadInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      // POST /api/leads → o agente de IA qualifica e gera o briefing.
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const corpo = await res.json().catch(() => ({}));
        throw new Error(corpo?.erro ?? `Erro ${res.status} ao enviar o projeto.`);
      }

      // Sucesso confirmado pela API → tela de sucesso premium.
      setEnviado(true);
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não foi possível enviar agora. Tente novamente em instantes.",
      );
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="animate-fade-in rounded-2xl border border-line bg-surface-card p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400/90" />
        <h2 className="mt-4 text-lg font-semibold text-zinc-100">
          Recebemos o seu projeto
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Nossa equipe já está analisando as informações. Em breve entraremos em
          contato com um briefing estruturado.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-fade-in space-y-5 rounded-2xl border border-line bg-surface-card p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo label="Empresa" obrigatorio>
          <input
            required
            value={form.empresa}
            onChange={set("empresa")}
            placeholder="Nome da sua empresa"
            className={CAMPO_BASE}
          />
        </Campo>
        <Campo label="Site">
          <input
            value={form.site ?? ""}
            onChange={set("site")}
            placeholder="https://"
            className={CAMPO_BASE}
          />
        </Campo>
        <Campo label="Seu nome" obrigatorio>
          <input
            required
            value={form.contato}
            onChange={set("contato")}
            placeholder="Nome do responsável"
            className={CAMPO_BASE}
          />
        </Campo>
        <Campo label="E-mail" obrigatorio>
          <input
            required
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="voce@empresa.com"
            className={CAMPO_BASE}
          />
        </Campo>
        <Campo label="Telefone">
          <input
            value={form.telefone ?? ""}
            onChange={set("telefone")}
            placeholder="(00) 00000-0000"
            className={CAMPO_BASE}
          />
        </Campo>
        <Campo label="Segmento" obrigatorio>
          <input
            required
            value={form.segmento}
            onChange={set("segmento")}
            placeholder="Ex.: Saúde, Educação, E-commerce"
            className={CAMPO_BASE}
          />
        </Campo>
      </div>

      <Campo label="O que você precisa?" obrigatorio>
        <textarea
          required
          value={form.escopo}
          onChange={set("escopo")}
          rows={4}
          placeholder="Descreva o escopo do projeto, objetivos e contexto."
          className={`${CAMPO_BASE} resize-none`}
        />
      </Campo>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo label="Orçamento estimado">
          <input
            value={form.orcamento ?? ""}
            onChange={set("orcamento")}
            placeholder="Ex.: R$ 15.000 – R$ 30.000"
            className={CAMPO_BASE}
          />
        </Campo>
        <Campo label="Prazo desejado">
          <input
            value={form.prazo ?? ""}
            onChange={set("prazo")}
            placeholder="Ex.: 60 dias"
            className={CAMPO_BASE}
          />
        </Campo>
      </div>

      {erro && (
        <p className="rounded-lg border border-red-500/25 bg-red-950/20 px-3 py-2 text-xs text-red-300">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {enviando ? "Enviando…" : "Enviar projeto"}
      </button>
    </form>
  );
}

function Campo({
  label,
  obrigatorio,
  children,
}: {
  label: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-zinc-400">
        {label}
        {obrigatorio && <span className="ml-0.5 text-zinc-600">*</span>}
      </span>
      {children}
    </label>
  );
}
