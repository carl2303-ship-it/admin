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

---

## Troubleshooting: "Page not found" (Netlify)

Sintoma: `admin.sportsevents.app` ou `*.netlify.app` mostra a página cinzenta/branca da Netlify **"Page not found"** (não o 404 da app Next).

### Causa mais comum (repo `carl2303-ship-it/admin`)

| Branch | Conteúdo |
|--------|----------|
| `main` | Só `README.md` (repo criado com autoInit) |
| `cursor/fase0-1-hub-shell-7566` | App Next completa + `netlify.toml` (PR [#1](https://github.com/carl2303-ship-it/admin/pull/1)) |

Se o site Netlify tem **Production branch = `main`**, o build publica um site sem `index`/runtime Next → **404 Netlify**.

### Fix imediato (escolher um)

**Opção A — mudar Production branch (rápido, sem merge)**

1. Netlify → site do PADEL HUB → **Site configuration** → **Build & deploy** → **Continuous deployment**.
2. **Production branch** → `cursor/fase0-1-hub-shell-7566` → Save.
3. **Deploys** → **Trigger deploy** → Deploy site.
4. Confirmar que o deploy usa commit da PR (há `package.json`, `src/`, `netlify.toml`) e que o build termina com o plugin `@netlify/plugin-nextjs`.

**Opção B — merge para `main` (só quando Carlos pedir)**

1. Merge da PR [#1](https://github.com/carl2303-ship-it/admin/pull/1) em `main`.
2. Garantir Production branch = `main`.
3. Trigger deploy (ou deixar o deploy automático do Git).

### Checklist se ainda falhar após a branch correcta

1. **Build log**: comando `npm run build`, plugin `@netlify/plugin-nextjs` activo, publish `.next` (não `dist` / `out`).
2. **Env vars** (Site configuration → Environment variables): pelo menos `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`. Sem isto o build pode passar mas login/KPIs falham — normalmente **não** causa o 404 genérico da Netlify.
3. **Domínio**: Domain management mostra `admin.sportsevents.app` no site correcto (não noutro site vazio).
4. **DNS**: CNAME `admin` → `<site>.netlify.app` (proxy Cloudflare off, ou configuração Netlify DNS).
5. **Deploy context**: o deploy marcado como **Published** / production (não um preview antigo).

### Config de referência neste repo

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Dependência: `@netlify/plugin-nextjs` em `package.json` (devDependency).
