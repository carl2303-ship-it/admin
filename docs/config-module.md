# Configuração central (`/configuracao`)

Área owner-only no PADEL HUB para estado das integrações, env Netlify, Stripe
Dashboard e intents ops (Boost / Padel1 / SE / Hub).

## Rotas

| Rota | Conteúdo |
|------|----------|
| `/configuracao` | Overview + checklist ops + Stripe shortcuts + env em falta |
| `/configuracao/boost` | Status + Stripe Edge UX + Dashboard links + env Boost + intents |
| `/configuracao/padel1` | Status alargado + Stripe HQ links + env + intents |
| `/configuracao/sportsevents` | Auth SE + Stripe Connect / Meta intents + env |
| `/configuracao/hub` | Staff/env + Netlify API tokens + checklist + intents |

## Fase 2 (este slice)

- Visibilidade env Netlify do **admin** (presença runtime; API opcional com
  `NETLIFY_AUTH_TOKEN` + `NETLIFY_ACCOUNT_ID`)
- Config Padel1 / SE além de status-only (intents + painéis Stripe)
- Links Stripe Dashboard por produto
- UX: checklist ops Carlos (migration + PAT + Netlify)

**Ainda não:** escrita live de env Netlify a partir do hub (slice seguinte).

## Segurança

- Só `owner` (e bootstrap).
- UI mostra **ligado / em falta** — nunca valores de secrets.
- Server actions não logam FormData de secrets.
- `hub_config_intents` guarda nome + estado + nota — **sem coluna de valor**.

## Stripe Boost

1. Secrets vivem no Edge do project Boost.
2. Se `SUPABASE_ACCESS_TOKEN` (ou `BOOST_SUPABASE_ACCESS_TOKEN`) + project ref → write via Management API.
3. Senão → intent `pending` + checklist in-hub (aplicar no dashboard Supabase Boost).

## Ops Carlos (obrigatório pós-merge)

1. **Migration** `supabase/migrations/20260930170000_create_hub_config_intents.sql`
   no project Supabase **SportsEvents** (SQL editor ou CLI).
2. **Opcional:** PAT Supabase → `SUPABASE_ACCESS_TOKEN` no Netlify admin (write
   live Stripe Boost).
3. **Opcional:** `NETLIFY_AUTH_TOKEN` + `NETLIFY_ACCOUNT_ID` (+ site id/name)
   para listar nomes de env no hub.

Plano completo: Project store `docs/config-central-hub.md`.

**Fora de âmbito:** módulo Estágios no Boost (fica em sportsevents.app).
