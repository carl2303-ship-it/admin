# PADEL HUB

Backoffice global em **admin.sportsevents.app** — shell Next.js que agrega Boost Store, Padel One HQ e SportsEvents com Auth único e RBAC (`hub_staff`).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4
- **Supabase Auth = projeto SportsEvents** (mesmo project; sem 4.º projeto)
- Tabela `hub_staff` nesse projeto; dados SE via o mesmo service role
- Clients read-only server-side para **Boost** e **Padel1** (projetos separados)
- Deploy: Netlify (`@netlify/plugin-nextjs`)

## Desenvolvimento

```bash
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_* + SUPABASE_SERVICE_ROLE_KEY = credenciais SportsEvents
# + BOOST_* / PADEL1_* (service roles dos outros produtos)
npm install
npm run dev
```

Abrir http://localhost:3000 → redirect para `/login` ou `/dashboard`.

## Estrutura relevante

| Path | Função |
|------|--------|
| `supabase/migrations/20260929140000_create_hub_staff.sql` | Tabela + RLS — **aplicar no Supabase SportsEvents** |
| `.env.example` | Auth/SE + Boost + Padel1 |
| `src/proxy.ts` | Gate Auth (Next 16 proxy) |
| `src/lib/auth/` | RBAC roles + guards |
| `src/lib/products/` | KPIs, deep-links, bridge SSO |
| `src/app/api/bridge/[product]` | Redirect magic link / deep-link |
| `docs/deploy-dns.md` | DNS + passos manuais |

## Fases

- **Fase 0/1 (este MVP):** shell, login, sidebar, KPIs degradáveis, deep-links + contrato bridge.
- **Fase 2+:** migrar UI Boost → HQ → SE; social multi-marca.

Plano: ver Project store `docs/backoffice-unificado.md`.
