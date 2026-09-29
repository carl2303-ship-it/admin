# PADEL HUB

Backoffice global em **admin.sportsevents.app** — shell Next.js que agrega Boost Store, Padel One HQ e SportsEvents com Auth único e RBAC (`hub_staff`).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4
- Supabase Auth (projeto **hub**) + clients read-only server-side para 3 produtos
- Deploy: Netlify (`@netlify/plugin-nextjs`)

## Desenvolvimento

```bash
cp .env.example .env.local
# preencher NEXT_PUBLIC_SUPABASE_* do hub + service roles
npm install
npm run dev
```

Abrir http://localhost:3000 → redirect para `/login` ou `/dashboard`.

## Estrutura relevante

| Path | Função |
|------|--------|
| `supabase/migrations/20260929140000_create_hub_staff.sql` | Tabela + RLS hub_staff |
| `.env.example` | Hub + Boost + Padel1 + SE |
| `src/proxy.ts` | Gate Auth (Next 16 proxy) |
| `src/lib/auth/` | RBAC roles + guards |
| `src/lib/products/` | KPIs, deep-links, bridge SSO |
| `src/app/api/bridge/[product]` | Redirect magic link / deep-link |
| `docs/deploy-dns.md` | DNS + passos manuais |

## Fases

- **Fase 0/1 (este MVP):** shell, login, sidebar, KPIs degradáveis, deep-links + contrato bridge.
- **Fase 2+:** migrar UI Boost → HQ → SE; social multi-marca.

Plano: ver Project store `docs/backoffice-unificado.md`.
