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

## Edge Functions (reutilizadas)

- `provision-saas-license`
- `stripe-checkout` (`saas-tour-subscription` a partir do hub)

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

| Só no Boost (Supabase Edge / Netlify Boost) | Para quê |
|---------------------------------------------|---------| 
| `STRIPE_SECRET_KEY` | Checkout / manage subscription nas EFs |
| `STRIPE_WEBHOOK_SECRET` | Webhook Stripe nas EFs |

Inventário detalhado + checkboxes: Project store `docs/paridade-boost-admin.md`.

## Legacy

Rodapé do módulo = emergência (Quill rico, upload multi-ficheiro Storage, preview email digital).
