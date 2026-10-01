-- PADEL HUB — intents de configuração (sem valores de secrets)
-- Aplicar no projeto Supabase SportsEvents (mesmo Auth do hub).

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'hub_config_product'
      and n.nspname = 'public'
  ) then
    create type public.hub_config_product as enum (
      'boost',
      'padel1',
      'sportsevents',
      'hub'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'hub_config_intent_status'
      and n.nspname = 'public'
  ) then
    create type public.hub_config_intent_status as enum (
      'pending',
      'applied',
      'cancelled'
    );
  end if;
end
$$;

create table if not exists public.hub_config_intents (
  id uuid primary key default gen_random_uuid(),
  product public.hub_config_product not null,
  secret_name text not null,
  status public.hub_config_intent_status not null default 'pending',
  note text,
  requested_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint hub_config_intents_secret_name_check check (
    char_length(secret_name) >= 3
    and secret_name !~ '\s'
  )
);

create index if not exists hub_config_intents_product_idx
  on public.hub_config_intents (product);
create index if not exists hub_config_intents_status_idx
  on public.hub_config_intents (status);

create or replace function public.set_hub_config_intents_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

drop trigger if exists hub_config_intents_set_updated_at on public.hub_config_intents;
create trigger hub_config_intents_set_updated_at
  before update on public.hub_config_intents
  for each row
  execute function public.set_hub_config_intents_updated_at();

alter table public.hub_config_intents enable row level security;

-- Sem policies de escrita para authenticated: o hub usa service role.
drop policy if exists "hub_config_intents_select_owner" on public.hub_config_intents;
create policy "hub_config_intents_select_owner"
  on public.hub_config_intents
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
