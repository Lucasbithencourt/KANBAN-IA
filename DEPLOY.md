# Deploy na Vercel — monorepo "CURSO IA"

Este repositório é um **monorepo**: a raiz (`CURSO IA/`) contém dois apps Next.js
independentes em subpastas. Cada app vira **um Projeto Vercel separado**, com o
**Root Directory** apontando para a sua subpasta.

```
CURSO IA/            ← raiz do repositório git
├─ kanban-inteligente/   → Projeto Vercel #1  (Root Directory: kanban-inteligente)
└─ ima-de-clientes/      → Projeto Vercel #2  (Root Directory: ima-de-clientes)
```

> **Por que dois projetos, e não um `vercel.json` na raiz?**
> A raiz não tem um app Next.js — por isso o build padrão gerou 404. A prática
> recomendada da Vercel para monorepos é **um projeto por app** com Root
> Directory na subpasta, e **não** um `vercel.json` raiz com `builds` (padrão
> legado que quebra o zero-config do Next). Cada app já tem seu próprio
> `vercel.json` fixando `framework: nextjs`.

## Variáveis de ambiente (iguais nos dois apps)

| Variável | Escopo | Onde é usada |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | client + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | client |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | **só** server (secreta) |
| `ANTHROPIC_API_KEY` | Production, Preview | **só** server (secreta) |

---

## Passo a passo pela CLI (sem abrir o navegador)

### 0. Instalar e autenticar (uma vez)

```bash
npm i -g vercel            # ou use "npx vercel ..." em cada comando

# Login sem navegador: gere um token em vercel.com/account/tokens e exporte:
export VERCEL_TOKEN="seu_token_aqui"
# Todos os comandos abaixo aceitam a flag --token "$VERCEL_TOKEN".
# (Alternativa interativa: `vercel login`.)
```

### 1. App 1 — kanban-inteligente

```bash
cd "/Users/lucasbithencourt/Documents/CURSO IA/kanban-inteligente"

# Vincula esta pasta a um Projeto Vercel (cria se não existir).
# Deployar de dentro da subpasta faz a Vercel usá-la como raiz do build.
vercel link --yes --token "$VERCEL_TOKEN"

# Injeta as variáveis de ambiente (repita trocando "production" por "preview"
# se quiser cobrir os deploys de preview). Modo não interativo via stdin:
printf '%s' "$SUPABASE_URL"      | vercel env add NEXT_PUBLIC_SUPABASE_URL production --token "$VERCEL_TOKEN"
printf '%s' "$SUPABASE_ANON"     | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --token "$VERCEL_TOKEN"
printf '%s' "$SUPABASE_SERVICE"  | vercel env add SUPABASE_SERVICE_ROLE_KEY production --token "$VERCEL_TOKEN"
printf '%s' "$ANTHROPIC_KEY"     | vercel env add ANTHROPIC_API_KEY production --token "$VERCEL_TOKEN"

# Deploy de produção (equivale a `npm run deploy`)
vercel --prod --token "$VERCEL_TOKEN"
```

### 2. App 2 — ima-de-clientes

```bash
cd "/Users/lucasbithencourt/Documents/CURSO IA/ima-de-clientes"

vercel link --yes --token "$VERCEL_TOKEN"

printf '%s' "$SUPABASE_URL"      | vercel env add NEXT_PUBLIC_SUPABASE_URL production --token "$VERCEL_TOKEN"
printf '%s' "$SUPABASE_ANON"     | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --token "$VERCEL_TOKEN"
printf '%s' "$SUPABASE_SERVICE"  | vercel env add SUPABASE_SERVICE_ROLE_KEY production --token "$VERCEL_TOKEN"
printf '%s' "$ANTHROPIC_KEY"     | vercel env add ANTHROPIC_API_KEY production --token "$VERCEL_TOKEN"

vercel --prod --token "$VERCEL_TOKEN"
```

> **Dica:** defina uma vez as variáveis-fonte no shell antes de rodar os blocos:
> ```bash
> export SUPABASE_URL="https://xxxx.supabase.co"
> export SUPABASE_ANON="eyJ..."
> export SUPABASE_SERVICE="eyJ..."
> export ANTHROPIC_KEY="sk-ant-..."
> ```

### 3. Comandos úteis do dia a dia

```bash
vercel env ls --token "$VERCEL_TOKEN"          # listar variáveis do projeto
vercel env pull .env.local --token "$VERCEL_TOKEN"   # baixar envs p/ rodar local
vercel --prod --token "$VERCEL_TOKEN"          # novo deploy de produção
vercel ls --token "$VERCEL_TOKEN"              # listar deploys
vercel logs <url-do-deploy> --token "$VERCEL_TOKEN"  # logs de runtime
```

Com os scripts adicionados, de dentro de cada pasta também funciona:

```bash
npm run deploy           # vercel --prod
npm run deploy:preview   # vercel (preview)
```

---

## Deploy automático por `git push` (opcional)

Os passos acima cobrem deploy **via CLI** (a subpasta é enviada como raiz, então
o 404 some). Se você preferir **deploy automático a cada `git push`** via
integração Git, cada projeto precisa ter o **Root Directory** configurado:

- `kanban-inteligente` → Root Directory: `kanban-inteligente`
- `ima-de-clientes` → Root Directory: `ima-de-clientes`

Esse campo (Settings → Build & Deployment → Root Directory) é o **único** ponto
que hoje se ajusta pelo dashboard. Se quiser ficar 100% no terminal, use os
deploys via CLI acima — eles não dependem desse campo.

---

## Observação sobre o nome da pasta

O nome `CURSO IA` tem espaço e acento apenas no **caminho local** — como é a raiz
do repositório git, o Root Directory de cada app é relativo e fica limpo
(`kanban-inteligente`, `ima-de-clientes`). Nada a corrigir para a Vercel; nos
comandos locais, apenas mantenha o caminho entre aspas por causa do espaço.
