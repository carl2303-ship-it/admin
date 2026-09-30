# Hardening RLS Boost — `admin_users` (opcional)

**NÃO aplicar em produção sem aprovação do Carlos.**

Hoje o admin Boost trata qualquer `authenticated` como admin (policies `WITH CHECK (true)`). Com o hub a usar service role server-side, o browser deixa de precisar de escrita ampla — podes restringir o Auth Boost.

## Ficheiro SQL (aplicar no projeto Supabase Boost)

Cópia versionada também em `supabase/optional/boost_admin_users_rls.sql` neste repo (referência; o schema real vive no projeto Boost).

### Passos

1. Criar tabela `admin_users` com `user_id` (uuid → auth.users).
2. Inserir os user ids dos admins Boost legados (e o bot `BOOST_EDGE_*` se usares password login).
3. Substituir policies de escrita em `products`, `orders`, `discount_codes`, `categories`, `brands`, `organizations`, etc. por `EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid())`.
4. Manter policies de leitura pública onde o storefront precisa (produtos activos, etc.).
5. Testar storefront + hub + `admin.html` legacy antes de cortar.

O hub **não** depende destas policies para o módulo Fase 2 (usa service role). O hardening protege o Auth Boost / legacy.
