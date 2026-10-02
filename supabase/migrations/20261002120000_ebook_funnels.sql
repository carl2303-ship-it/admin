-- ============================================================================
-- Ebook Funnel Builder — Boost Supabase (gmpyjnufuvsoewbtirsg)
-- Aplicar no SQL Editor do projeto Boost OU via `supabase db push`.
-- Data: 2026-10-02
-- ============================================================================

-- 1) Tabelas de configuração de funis
CREATE TABLE IF NOT EXISTS public.ebook_funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  ebook_price_cents integer NOT NULL CHECK (ebook_price_cents > 0),
  upsell_price_cents integer NOT NULL CHECK (upsell_price_cents > 0),
  ebook_product_type text NOT NULL,
  upsell_product_type text NOT NULL,
  stripe_ebook_name text NOT NULL DEFAULT '',
  stripe_upsell_name text NOT NULL DEFAULT '',
  languages text[] NOT NULL DEFAULT ARRAY['pt']::text[],
  headline text NOT NULL DEFAULT '',
  subheadline text NOT NULL DEFAULT '',
  cta_label text NOT NULL DEFAULT 'Comprar agora',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ebook_funnels_slug_unique UNIQUE (slug),
  CONSTRAINT ebook_funnels_ebook_pt_unique UNIQUE (ebook_product_type),
  CONSTRAINT ebook_funnels_upsell_pt_unique UNIQUE (upsell_product_type),
  CONSTRAINT ebook_funnels_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT ebook_funnels_ebook_pt_format CHECK (
    ebook_product_type = 'ebook'
    OR ebook_product_type ~ '^ebook_[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  CONSTRAINT ebook_funnels_upsell_pt_format CHECK (
    upsell_product_type = 'upsell'
    OR upsell_product_type ~ '^upsell_[a-z0-9]+(?:-[a-z0-9]+)*$'
  )
);

CREATE INDEX IF NOT EXISTS ebook_funnels_status_idx
  ON public.ebook_funnels (status);

CREATE INDEX IF NOT EXISTS ebook_funnels_slug_idx
  ON public.ebook_funnels (slug);

CREATE TABLE IF NOT EXISTS public.ebook_funnel_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid NOT NULL REFERENCES public.ebook_funnels(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'pt',
  kind text NOT NULL
    CHECK (kind IN (
      'ebook_pdf',
      'cheat_sheet',
      'mental_cheat_sheet',
      'audio',
      'upsell_video',
      'cover',
      'other'
    )),
  storage_path text NOT NULL,
  public_url text NOT NULL,
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ebook_funnel_assets_unique UNIQUE (funnel_id, language, kind)
);

CREATE INDEX IF NOT EXISTS ebook_funnel_assets_funnel_idx
  ON public.ebook_funnel_assets (funnel_id);

-- 2) Alargar product_type em ebook_purchases (legado ebook|upsell + dinâmicos)
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'ebook_purchases'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%product_type%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.ebook_purchases DROP CONSTRAINT %I', constraint_name);
  END IF;

  ALTER TABLE public.ebook_purchases
    ADD CONSTRAINT ebook_purchases_product_type_check
    CHECK (
      product_type IN ('ebook', 'upsell')
      OR product_type ~ '^ebook_[a-z0-9]+(?:-[a-z0-9]+)*$'
      OR product_type ~ '^upsell_[a-z0-9]+(?:-[a-z0-9]+)*$'
    );
END
$$;

-- 3) updated_at trigger
CREATE OR REPLACE FUNCTION public.set_ebook_funnel_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ebook_funnels_updated_at ON public.ebook_funnels;
CREATE TRIGGER trg_ebook_funnels_updated_at
  BEFORE UPDATE ON public.ebook_funnels
  FOR EACH ROW EXECUTE FUNCTION public.set_ebook_funnel_updated_at();

DROP TRIGGER IF EXISTS trg_ebook_funnel_assets_updated_at ON public.ebook_funnel_assets;
CREATE TRIGGER trg_ebook_funnel_assets_updated_at
  BEFORE UPDATE ON public.ebook_funnel_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_ebook_funnel_updated_at();

-- 4) RLS — funis activos legíveis pelo anon (landing dinâmica)
ALTER TABLE public.ebook_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_funnel_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active ebook funnels" ON public.ebook_funnels;
CREATE POLICY "Public read active ebook funnels"
  ON public.ebook_funnels
  FOR SELECT
  TO public
  USING (status = 'active');

DROP POLICY IF EXISTS "Public read assets of active funnels" ON public.ebook_funnel_assets;
CREATE POLICY "Public read assets of active funnels"
  ON public.ebook_funnel_assets
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.ebook_funnels f
      WHERE f.id = funnel_id AND f.status = 'active'
    )
  );

-- Escrita: só service role (hub) / authenticated admin — service_role bypassa RLS.
-- Políticas authenticated opcionais para futuros clients com sessão Boost:
DROP POLICY IF EXISTS "Authenticated manage ebook funnels" ON public.ebook_funnels;
CREATE POLICY "Authenticated manage ebook funnels"
  ON public.ebook_funnels
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage ebook funnel assets" ON public.ebook_funnel_assets;
CREATE POLICY "Authenticated manage ebook funnel assets"
  ON public.ebook_funnel_assets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5) Garantir bucket ebook-materials (idempotente)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ebook-materials',
  'ebook-materials',
  true,
  104857600,
  ARRAY[
    'application/pdf',
    'video/mp4',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp3',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/zip'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Comentários
COMMENT ON TABLE public.ebook_funnels IS
  'Configuração de funis ebook (landing + OTO). Gerido pelo PADEL HUB /produtos/boost/funis.';
COMMENT ON TABLE public.ebook_funnel_assets IS
  'Materiais por idioma/kind no bucket ebook-materials.';
COMMENT ON COLUMN public.ebook_funnels.ebook_product_type IS
  'Chave Stripe metadata productType, ex. ebook_meu-slug (legado: ebook).';
COMMENT ON COLUMN public.ebook_funnels.upsell_product_type IS
  'Chave Stripe metadata productType, ex. upsell_meu-slug (legado: upsell).';
