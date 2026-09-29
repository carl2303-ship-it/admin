# Deploy & DNS — PADEL HUB

## Domínio

**Produção:** `admin.sportsevents.app`

### DNS (Cloudflare / registo do domínio sportsevents.app)

| Tipo | Nome | Valor | Notas |
|------|------|-------|--------|
| CNAME | `admin` | `<site>.netlify.app` | Preferido com Netlify DNS ou proxy off |
| ou ALIAS/ANAME | `admin` | Netlify load balancer | Se o DNS do host exigir |

No Netlify: **Domain management → Add domain alias** `admin.sportsevents.app`, depois HTTPS automático.

### Auth redirects (Supabase SportsEvents)

O hub **reutiliza o projeto Supabase do SportsEvents** (não criar projeto novo).

No dashboard desse projeto (`tprbpeacicadsbmvxcqk`):

- Adicionar Redirect URLs: `https://admin.sportsevents.app/auth/callback`, `http://localhost:3000/auth/callback`
- Site URL pode continuar `https://sportsevents.app` (o ERP); o callback do hub é whitelist à parte

## Passos manuais (Carlos)

1. **Não criar** projeto Supabase extra — usar o de SportsEvents.
2. Correr a migration `supabase/migrations/20260929140000_create_hub_staff.sql` **nesse** projeto (SQL Editor ou CLI linked ao SE).
3. Garantir user Auth (email/password) para cada membro — podes reutilizar contas já usadas no `/admin` do SE.
4. Seed `hub_staff`:

```sql
insert into public.hub_staff (user_id, email, full_name, role)
values (
  '<uuid-auth-user>',  -- auth.users do projeto SportsEvents
  'teu@email',
  'Carlos',
  'owner'
);
```

5. Opcional bridge cross-produto: `boost_user_id` / `padel1_user_id` (UUIDs nos outros Auth). Para SE, `se_user_id` costuma ser o mesmo `user_id` (Auth partilhado) — o bridge faz fallback para `user_id` se estiver vazio.
6. **Netlify**: ligar este repo, env a partir de `.env.example` (`NEXT_PUBLIC_SUPABASE_*` + `SUPABASE_SERVICE_ROLE_KEY` = SE; + `BOOST_*` / `PADEL1_*`), domínio `admin.sportsevents.app`.
7. Service roles Boost / Padel1 só como env server-side (nunca `NEXT_PUBLIC_*`).

## Gaps SSO (legacy)

Ver comentários em `src/lib/products/bridge.ts`. Boost e Padel1 continuam Auth separados; SE partilha Auth com o hub.
