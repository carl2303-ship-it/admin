# Configuração central (`/configuracao`)

Área owner-only no PADEL HUB para estado das integrações e rotação Stripe Boost.

## Rotas

| Rota | Conteúdo |
|------|----------|
| `/configuracao` | Overview Boost / Padel1 / SE / Hub |
| `/configuracao/boost` | Status env + Stripe Edge UX + intents |
| `/configuracao/padel1` | Status `PADEL1_*` + deep-link HQ |
| `/configuracao/sportsevents` | Status Auth SE + nota Stripe/Meta externos |
| `/configuracao/hub` | Site URL, service role, PAT, atalho `/equipa` |

## Segurança

- Só `owner` (e bootstrap).
- UI mostra **ligado / em falta** — nunca valores de secrets.
- Server actions não logam FormData de secrets.
- `hub_config_intents` guarda nome + estado + nota — **sem coluna de valor**.

## Stripe Boost

1. Secrets vivem no Edge do project Boost.
2. Se `SUPABASE_ACCESS_TOKEN` (ou `BOOST_SUPABASE_ACCESS_TOKEN`) + project ref → write via Management API.
3. Senão → intent `pending` + checklist in-hub (aplicar no dashboard Supabase Boost).

Migration: `supabase/migrations/20260930170000_create_hub_config_intents.sql` (SportsEvents).

Plano completo: Project store `docs/config-central-hub.md`.
