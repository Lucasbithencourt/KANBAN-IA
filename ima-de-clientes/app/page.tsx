import Link from "next/link";
import { LeadForm } from "@/components/lead-form/LeadForm";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-16">
      <header className="mb-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-raised px-3 py-1 text-[11px] font-medium text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
          Portal de novos projetos
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Conte sobre o seu projeto
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
          Preencha os dados abaixo. Nossa inteligência qualifica o pedido e
          prepara um briefing estruturado para a nossa equipe em minutos.
        </p>
      </header>

      <LeadForm />

      <footer className="mt-10 text-center">
        <Link
          href="/dashboard"
          className="text-[11px] text-zinc-600 transition-colors hover:text-zinc-400"
        >
          Acesso da equipe →
        </Link>
      </footer>
    </main>
  );
}
