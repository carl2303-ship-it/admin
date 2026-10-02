-- ============================================================================
-- Ebook funnels — kinds genéricos + landing_body (AI)
-- Boost Supabase (gmpyjnufuvsoewbtirsg)
-- Data: 2026-10-02 (corrigido: sem colisão thankyou_bonus)
-- Idempotente: seguro re-correr no SQL Editor mesmo se a versão
-- anterior falhou a meio (landing_body / kind check já podem existir).
-- ============================================================================

-- 1) Coluna landing_body (JSON da landing gerada por AI)
ALTER TABLE public.ebook_funnels
  ADD COLUMN IF NOT EXISTS landing_body jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.ebook_funnels.landing_body IS
  'Copy rica da landing (benefits, body_markdown, images, tone) gerada por AI ou editada.';

-- 2) Alargar CHECK de kind: genéricos + legados
DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Drop explícito do nome canónico (re-runs)
  ALTER TABLE public.ebook_funnel_assets
    DROP CONSTRAINT IF EXISTS ebook_funnel_assets_kind_check;

  -- Drop qualquer outro CHECK que mencione kind
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'ebook_funnel_assets'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%kind%'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.ebook_funnel_assets DROP CONSTRAINT %I', constraint_name);
  END IF;

  ALTER TABLE public.ebook_funnel_assets
    ADD CONSTRAINT ebook_funnel_assets_kind_check
    CHECK (kind IN (
      -- genéricos
      'ebook_pdf',
      'upsell',
      'downsell',
      'thankyou_bonus',
      'cover',
      'landing_image',
      'other',
      -- legado (backward compatible — ficam se não migrarem)
      'cheat_sheet',
      'mental_cheat_sheet',
      'audio',
      'upsell_video'
    ));
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- já existe com o nome certo
END
$$;

-- 3) Garantir UNIQUE (funnel, lang, kind) — galeria multi fica em landing_body.images
ALTER TABLE public.ebook_funnel_assets
  DROP CONSTRAINT IF EXISTS ebook_funnel_assets_unique;

DROP INDEX IF EXISTS public.ebook_funnel_assets_unique_non_gallery;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ebook_funnel_assets_unique'
  ) THEN
    ALTER TABLE public.ebook_funnel_assets
      ADD CONSTRAINT ebook_funnel_assets_unique
      UNIQUE (funnel_id, language, kind);
  END IF;
END
$$;

-- 4) Migração suave de kinds legados → genéricos (SEM colisões)
-- 4a) upsell_video → upsell (só se ainda não houver upsell)
UPDATE public.ebook_funnel_assets a
SET kind = 'upsell', updated_at = now()
WHERE a.kind = 'upsell_video'
  AND NOT EXISTS (
    SELECT 1 FROM public.ebook_funnel_assets b
    WHERE b.funnel_id = a.funnel_id
      AND b.language = a.language
      AND b.kind = 'upsell'
  );

-- 4b) UMA só linha legado → thankyou_bonus por (funnel_id, language).
--     Prioridade: cheat_sheet > audio > mental_cheat_sheet.
--     Os restantes ficam com o kind legado (ainda válido no CHECK).
--     Se thankyou_bonus já existir (migração parcial), não toca em nada.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY funnel_id, language
      ORDER BY
        CASE kind
          WHEN 'cheat_sheet' THEN 1
          WHEN 'audio' THEN 2
          WHEN 'mental_cheat_sheet' THEN 3
          ELSE 9
        END,
        created_at ASC NULLS LAST
    ) AS rn
  FROM public.ebook_funnel_assets
  WHERE kind IN ('cheat_sheet', 'audio', 'mental_cheat_sheet')
),
candidates AS (
  SELECT r.id
  FROM ranked r
  JOIN public.ebook_funnel_assets a ON a.id = r.id
  WHERE r.rn = 1
    AND NOT EXISTS (
      SELECT 1 FROM public.ebook_funnel_assets b
      WHERE b.funnel_id = a.funnel_id
        AND b.language = a.language
        AND b.kind = 'thankyou_bonus'
    )
)
UPDATE public.ebook_funnel_assets a
SET kind = 'thankyou_bonus', updated_at = now()
FROM candidates c
WHERE a.id = c.id;

COMMENT ON TABLE public.ebook_funnel_assets IS
  'Materiais por idioma/kind (genéricos: ebook_pdf, upsell, downsell, thankyou_bonus, cover, landing_image). Legados ainda aceites. Galeria multi → landing_body.images.';
