-- PADEL HUB — staff global
-- Aplicar no projeto Supabase SportsEvents (mesmo Auth do hub;
-- NÃO criar projeto Supabase novo só para admin.sportsevents.app).

create extension if not exists "pgcrypto";

create type public.hub_role as enum (
  'owner',
  'ops',
  'commerce',
  'platform',
  'content',
  'readonly'
);

create table if not exists public.hub_staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.hub_role not null default 'readonly',
  active boolean not null default true,
  -- Mapeamento opcional para contas nos 3 produtos (SSO bridge futuro)
  boost_user_id uuid,
  padel1_user_id uuid,
  se_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hub_staff_user_id_unique unique (user_id),
  constraint hub_staff_email_unique unique (email)
);

create index if not exists hub_staff_role_idx on public.hub_staff (role);
create index if not exists hub_staff_active_idx on public.hub_staff (active);

create or replace function public.set_hub_staff_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hub_staff_set_updated_at on public.hub_staff;
create trigger hub_staff_set_updated_at
  before update on public.hub_staff
  for each row
  execute function public.set_hub_staff_updated_at();

alter table public.hub_staff enable row level security;

-- Staff activo pode ler o próprio registo
drop policy if exists "hub_staff_select_own" on public.hub_staff;
create policy "hub_staff_select_own"
  on public.hub_staff
  for select
  to authenticated
  using (auth.uid() = user_id and active = true);

-- Owner pode ler toda a equipa (via JWT claim opcional; fallback service role no servidor)
drop policy if exists "hub_staff_select_owner" on public.hub_staff;
create policy "hub_staff_select_owner"
  on public.hub_staff
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.hub_staff s
      where s.user_id = auth.uid()
        and s.active = true
        and s.role = 'owner'
    )
  );

-- Escrita apenas via service role (API do hub) — sem policies de insert/update para authenticated

comment on table public.hub_staff is 'Equipa global PADEL HUB (admin.sportsevents.app)';
comment on column public.hub_staff.boost_user_id is 'auth.users id no Supabase Boost (opcional, bridge)';
comment on column public.hub_staff.padel1_user_id is 'auth.users id no Supabase padel1 (opcional, bridge)';
comment on column public.hub_staff.se_user_id is 'Opcional; Auth partilhado com SE — se NULL, bridge SE usa user_id';

-- Seed manual (exemplo): após user Auth no projeto SportsEvents,
-- insert into public.hub_staff (user_id, email, full_name, role)
-- values ('<uuid-do-auth>', 'carlos@…', 'Carlos', 'owner');
