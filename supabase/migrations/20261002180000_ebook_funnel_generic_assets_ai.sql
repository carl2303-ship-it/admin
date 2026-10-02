-- ============================================================================
-- Ebook funnels — kinds genéricos + landing_body (AI)
-- Boost Supabase (gmpyjnufuvsoewbtirsg)
-- Data: 2026-10-02
-- Idempotente: seguro re-correr no SQL Editor.
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
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'ebook_funnel_assets'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%kind%';

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
      -- legado (backward compatible)
      'cheat_sheet',
      'mental_cheat_sheet',
      'audio',
      'upsell_video'
    ));
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

-- 4) Migração suave de kinds legados → genéricos (sem colisões)
UPDATE public.ebook_funnel_assets a
SET kind = 'upsell', updated_at = now()
WHERE a.kind = 'upsell_video'
  AND NOT EXISTS (
    SELECT 1 FROM public.ebook_funnel_assets b
    WHERE b.funnel_id = a.funnel_id
      AND b.language = a.language
      AND b.kind = 'upsell'
  );

UPDATE public.ebook_funnel_assets a
SET kind = 'thankyou_bonus', updated_at = now()
WHERE a.kind = 'cheat_sheet'
  AND NOT EXISTS (
    SELECT 1 FROM public.ebook_funnel_assets b
    WHERE b.funnel_id = a.funnel_id
      AND b.language = a.language
      AND b.kind = 'thankyou_bonus'
  );

UPDATE public.ebook_funnel_assets a
SET kind = 'thankyou_bonus', updated_at = now()
WHERE a.kind = 'audio'
  AND NOT EXISTS (
    SELECT 1 FROM public.ebook_funnel_assets b
    WHERE b.funnel_id = a.funnel_id
      AND b.language = a.language
      AND b.kind = 'thankyou_bonus'
  );

UPDATE public.ebook_funnel_assets a
SET kind = 'thankyou_bonus', updated_at = now()
WHERE a.kind = 'mental_cheat_sheet'
  AND NOT EXISTS (
    SELECT 1 FROM public.ebook_funnel_assets b
    WHERE b.funnel_id = a.funnel_id
      AND b.language = a.language
      AND b.kind = 'thankyou_bonus'
  );

COMMENT ON TABLE public.ebook_funnel_assets IS
  'Materiais por idioma/kind (genéricos: ebook_pdf, upsell, downsell, thankyou_bonus, cover, landing_image). Legados ainda aceites. Galeria multi → landing_body.images.';
