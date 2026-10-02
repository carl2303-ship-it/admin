# Módulo Boost Store (paridade total)

UI no hub em `/produtos/boost/*`. Meta: **substituir o `admin.html`** para o dia-a-dia — não MVP + fallback forever.

## Auth / RBAC

- Gate: `hub_staff` no Supabase SportsEvents (`requireHubAccess('boost')`).
- Leitura módulo: `owner`, `commerce`, `content` (+ bootstrap).
- Escrita loja/SaaS/marketing: `owner`, `commerce` (+ bootstrap).
- Escrita blog: `owner`, `commerce`, `content` (+ bootstrap).
- Equipa hub (`/equipa`): só `owner` (criar/editar contas).
- Service role Boost **nunca** no browser — Server Actions / RSC.

## Env

- `BOOST_SUPABASE_URL` / `BOOST_SUPABASE_SERVICE_ROLE_KEY` / `BOOST_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BOOST_ADMIN_URL` — deep-link emergência
- `BOOST_EDGE_AUTH_EMAIL` + `BOOST_EDGE_AUTH_PASSWORD` ou `BOOST_EDGE_USER_ID`
- `NEXT_PUBLIC_BOOST_STORE_URL`
- `NEXT_PUBLIC_TOUR_APP_URL` — base da App Tour nos cards SaaS (default `https://tour.padel1.app`; **não** `tour.boostpadel.store`)

## Edge Functions (reutilizadas)

- `provision-saas-license`
- `stripe-checkout` (`saas-tour-subscription` a partir do hub)

## SaaS Tour — datas e renovação

### Datas no card activo

- **Início do plano:** `contract_start`; se vazio → deriva de `created_at` (UI marca “(criado em)”); se ambos vazios → `—`.
- **Fim do plano:** `subscription_expires_at`; se vazio → `—`.
- Badge «cancela no fim» quando `cancel_at_period_end`.

### Enviar link de pagamento (manual)

Botão **Enviar link de pagamento** em `/produtos/boost/saas` → server action → Edge `stripe-checkout` com `sendPaymentLinkEmail: true` (mesmo caminho do admin Boost).

Requer no Netlify admin: `BOOST_SUPABASE_URL`, `BOOST_SUPABASE_ANON_KEY`, service role, e preferencialmente `BOOST_EDGE_*`. A UI mostra aviso âmbar se Edge estiver incompleta.

### Renovação automática (cron Netlify)

1. Scheduled function `netlify/functions/saas-renewal-cron.mts` (`@daily`, UTC).
2. Chama `POST /api/cron/saas-renewals` com `Authorization: Bearer SAAS_RENEWAL_CRON_SECRET`.
3. Para cada org `source=boost` activa, com email + `subscription_expires_at` na janela (±1–2 dias), **sem** Stripe a auto-renovar (`stripe_subscription_id` com `cancel_at_period_end=false` é saltada), gera+envia payment link e grava `renewal_payment_link_sent_at`.

Env: `SAAS_RENEWAL_CRON_SECRET` (ou `CRON_SECRET`).

Migration Boost (coluna): `supabase/migrations/20261001150000_organizations_renewal_payment_link_sent_at.sql`.

## Rotas

| Rota | Tab admin.html |
|------|----------------|
| `/produtos/boost/produtos` | Produtos |
| `/produtos/boost/pedidos` | Pedidos |
| `/produtos/boost/categorias` | Categorias |
| `/produtos/boost/marcas` | Marcas |
| `/produtos/boost/descontos` | Descontos |
| `/produtos/boost/blog` | Blog |
| `/produtos/boost/newsletter` | Newsletter |
| `/produtos/boost/ebook-leads` | Leads Ebook |
| `/produtos/boost/ebook-compras` | Compras Ebook |
| `/produtos/boost/analytics` | Analytics |
| `/produtos/boost/saas` | SaaS Tour |
| `/produtos/boost/stripe` | (novo) visibilidade Stripe |
| `/produtos/boost/contas` | (novo) owners Tour |
| `/equipa` | Contas hub_staff (não existia no Boost) |

## Fora de âmbito (módulo Boost)

- **Estágios** — geridos em **sportsevents.app** (ERP SE), não no hub Boost. Sem rota `/produtos/boost/estagios`.

## Stripe no hub (sem `STRIPE_SECRET_KEY`)

O hub **não** precisa de `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` no Netlify do admin.
Pagamentos e webhooks ficam nas **Edge Functions do projeto Boost** (onde já existe `STRIPE_SECRET_KEY`).

Para **visibilidade** (`/produtos/boost/stripe`) + gerar payment links SaaS:

| Env no hub (admin Netlify) | Para quê |
|----------------------------|----------|
| `BOOST_SUPABASE_URL` | Client + invoke Edge |
| `BOOST_SUPABASE_SERVICE_ROLE_KEY` | Ler orgs / ebook sessions (tabelas) |
| `BOOST_SUPABASE_ANON_KEY` | Invoke Edge (`stripe-checkout`, provision) |
| `BOOST_EDGE_AUTH_EMAIL` + `BOOST_EDGE_AUTH_PASSWORD` **ou** `BOOST_EDGE_USER_ID` | JWT para EFs autenticadas |
| `NEXT_PUBLIC_BOOST_STORE_URL` | Link loja na UI Stripe |
| `NEXT_PUBLIC_TOUR_APP_URL` | Base App Tour nos cards SaaS (default `https://tour.padel1.app`) |

### URLs Tour nos cards SaaS (`/produtos/boost/saas`)

| Label UI | URL | Significado |
|----------|-----|-------------|
| **App Tour (login)** | `{TOUR_APP_URL}` | Onde o organizador faz login |
| **Entrada com marca** | `{TOUR_APP_URL}/{slug}` | Mesma app com cores/marca do org (via `organizationTheme` no padel-one-tour) |

**«Página pública» (legado):** o email de credenciais Boost e o link do slug no admin antigo apontavam para `tour.boostpadel.store/{slug}`. Não era um site marketing separado — era a App Tour com tema do organizador. O hub renomeou para **Entrada com marca** e usa `tour.padel1.app`.

Os emails de credenciais (botão «Credenciais») são enviados pela Edge Function Boost `provision-saas-license` → `sendTourCredentialsEmail`. Esse template também precisa do domínio correcto (repo `boostpadel`).

| Só no Boost (Supabase Edge / Netlify Boost) | Para quê |
|---------------------------------------------|---------|
| `STRIPE_SECRET_KEY` | Checkout / manage subscription nas EFs |
| `STRIPE_WEBHOOK_SECRET` | Webhook Stripe nas EFs |
| `TOUR_APP_URL` (opcional na Edge) | Override no email de credenciais; default `https://tour.padel1.app` |

Inventário detalhado + checkboxes: Project store `docs/paridade-boost-admin.md`.

## Legacy

Rodapé do módulo = emergência (Quill rico, upload multi-ficheiro Storage, preview email digital).
