-- =============================================================================
-- SEED: 37 clubes europeus (legado sportsevents.app/admin) → public.partners
-- Projecto Supabase: SportsEvents (ref tprbpeacicadsbmvxcqk)
--
-- COMO CORRER (Carlos):
-- 1. Abrir https://supabase.com/dashboard/project/tprbpeacicadsbmvxcqk/sql/new
-- 2. Colar TODO este ficheiro e Run
-- 3. Confirmar no fim: clubes_padel >= 37
-- 4. Abrir https://admin.sportsevents.app/produtos/sportsevents/parceiros → filtro «Todos»
--
-- Idempotente: não duplica (mesmo name + country_code + type CLUBE_PADEL).
-- Se der erro no type/status (enum), diz ao agente a mensagem exacta.
-- =============================================================================

BEGIN;

