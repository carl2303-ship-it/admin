# Módulo Boost Store (Fase 2)

UI no hub em `/produtos/boost/*`. Substitui o placeholder da Fase 1 para as tabs críticas do `admin.html`.

## Auth / RBAC

- Gate: `hub_staff` no Supabase SportsEvents (`requireHubAccess('boost')`).
- Leitura: `owner`, `commerce`, `content` (+ bootstrap).
- Escrita: `owner`, `commerce` (+ bootstrap).
- Service role Boost **nunca** no browser — Server Actions / RSC.

## Env

Já existentes:

- `BOOST_SUPABASE_URL`
- `BOOST_SUPABASE_SERVICE_ROLE_KEY`
- `BOOST_SUPABASE_ANON_KEY` — necessário para invocar Edge Functions
- `NEXT_PUBLIC_BOOST_ADMIN_URL` — deep-link legacy

Novas (opcionais):

| Var | Uso |
|-----|-----|
| `BOOST_EDGE_AUTH_EMAIL` + `BOOST_EDGE_AUTH_PASSWORD` | Conta Auth Boost dedicada para `provision-saas-license` (exige JWT user) |
| `BOOST_EDGE_USER_ID` | Alternativa: user id Boost para generateLink+verifyOtp |
| `NEXT_PUBLIC_BOOST_STORE_URL` | Base URLs Stripe success/cancel (default `https://boostpadel.store`) |

Se `hub_staff.boost_user_id` estiver mapeado, o hub tenta usá-lo para Edge JWT antes de falhar.

## Edge Functions (reutilizadas)

- `provision-saas-license` — criar licença + login Tour; `resend_credentials`
- `stripe-checkout` com `productType: 'saas-tour-subscription'` — link pagamento

Não há lógica Stripe no repo admin.

## Migrado vs legacy

| Área | Hub | Legacy |
|------|-----|--------|
| Produtos | ✅ CRUD essencial | Upload multi-imagem / Quill rico |
| Pedidos | ✅ lista + status | email teste digital |
| Categorias / Marcas | ✅ | — |
| Descontos | ✅ básico | applies_to produtos específicos (UI parcial) |
| SaaS Tour | ✅ | editar cores avançado no modal |
| Blog / estágios / newsletter / ebooks / analytics | — | ✅ admin.html |

Fallback: bridge `/api/bridge/boost` + deep-link no rodapé de cada página do módulo.

## RLS hardening (opcional)

Ver `docs/boost-rls-admin-users.md` — **não aplicar em produção sem Carlos**.
