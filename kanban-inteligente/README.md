# Kanban Inteligente

Board de fluxo de produção para agências digitais. Interface minimalista, dark mode nativo,
inspirada em Linear / Vercel / shadcn. Next.js (App Router) + TypeScript + Tailwind CSS.

## Como rodar

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

## Estrutura

```
kanban-inteligente/
├─ app/
│  ├─ globals.css        # base Tailwind + estética dark
│  ├─ layout.tsx         # fonte, metadata, shell
│  └─ page.tsx           # header + board
├─ components/kanban/
│  ├─ KanbanBoard.tsx    # container e estado
│  ├─ KanbanColumn.tsx   # estrutura de cada coluna
│  └─ TaskCard.tsx       # card + regra de UI "Bloqueado"
└─ lib/
   ├─ types.ts           # tipos (Task, Column, ColumnId)
   └─ data.ts            # colunas fixas + tarefas de exemplo
```

## Colunas

A Fazer · Em Produção · Revisão Interna · Aguardando Cliente ·
Bloqueado (Estouro de Escopo) · Concluído

## Regra especial de UI

Tarefas na coluna **Bloqueado (Estouro de Escopo)** recebem borda âmbar sutil,
fundo opaco e ícone de alerta — sinalização imediata para o gestor.
