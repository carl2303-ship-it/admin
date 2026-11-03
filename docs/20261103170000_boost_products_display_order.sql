-- =============================================================================
-- SportsEvents (tprbpeacicadsbmvxcqk) — boost.products.display_order
-- HUB-37: ordem loja = featured → display_order → sold-out last
--
-- COMO CORRER (Carlos):
-- 1. https://supabase.com/dashboard/project/tprbpeacicadsbmvxcqk/sql/new
-- 2. Colar TODO este ficheiro → Run
-- 3. Confirmar: SELECT id, name, is_featured, display_order, stock
--               FROM boost.products ORDER BY display_order LIMIT 20;
-- =============================================================================

ALTER TABLE boost.products
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

-- Backfill: featured first, then created_at desc → 0..n
WITH ranked AS (
  SELECT
    id,
    (ROW_NUMBER() OVER (
      ORDER BY is_featured DESC NULLS LAST, created_at DESC NULLS LAST
    ) - 1)::integer AS ord
  FROM boost.products
)
UPDATE boost.products p
SET display_order = ranked.ord
FROM ranked
WHERE p.id = ranked.id;

CREATE INDEX IF NOT EXISTS products_store_order_idx
  ON boost.products (active, is_featured DESC, display_order ASC);
