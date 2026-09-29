# Deploy & DNS — PADEL HUB

## Domínio

**Produção:** `admin.sportsevents.app`

### DNS (Cloudflare / registo do domínio sportsevents.app)

| Tipo | Nome | Valor | Notas |
|------|------|-------|--------|
| CNAME | `admin` | `<site>.netlify.app` | Preferido com Netlify DNS ou proxy off |
| ou ALIAS/ANAME | `admin` | Netlify load balancer | Se o DNS do host exigir |

No Netlify: **Domain management → Add domain alias** `admin.sportsevents.app`, depois HTTPS automático.

### Auth redirects (Supabase Hub)

No dashboard do projeto Supabase do hub:

- Site URL: `https://admin.sportsevents.app`
- Redirect URLs: `https://admin.sportsevents.app/auth/callback`, `http://localhost:3000/auth/callback`

## Passos manuais (Carlos)

1. **Criar projeto Supabase “PADEL HUB”** (novo, não reutilizar SE/Boost/padel1 como Auth principal).
2. Correr a migration `supabase/migrations/20260929140000_create_hub_staff.sql`.
3. Criar user Auth (email/password) para cada membro da equipa.
4. Seed `hub_staff`:

```sql
insert into public.hub_staff (user_id, email, full_name, role)
values (
  '<uuid-auth-user>',
  'teu@email',
  'Carlos',
  'owner'
);
```

5. Opcional bridge: preencher `boost_user_id` / `padel1_user_id` / `se_user_id` com os UUIDs Auth nos produtos destino (e garantir `super_admins` / `staff_members` lá).
6. **Netlify**: ligar este repo, configurar env a partir de `.env.example`, domínio `admin.sportsevents.app`.
7. Service roles Boost / Padel1 / SE só como env server-side (nunca `NEXT_PUBLIC_*`).

## Gaps SSO (legacy)

Ver comentários em `src/lib/products/bridge.ts` e notas nas páginas de produto. Enquanto não há exchange token nos legacy, o hub usa magic link + fallback deep-link.
