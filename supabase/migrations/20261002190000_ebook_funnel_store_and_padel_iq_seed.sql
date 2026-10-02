-- ============================================================================
-- Funis ebook → loja (funnel_slug) + seed PADEL IQ PRO (PT)
-- Boost Supabase (gmpyjnufuvsoewbtirsg)
-- Data: 2026-10-02
-- Idempotente: seguro re-correr no SQL Editor.
-- ============================================================================

-- 1) Ligação produto loja ↔ funil
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS funnel_slug text;

COMMENT ON COLUMN public.products.funnel_slug IS
  'Slug do ebook_funnels associado. learn_more_url aponta para a landing do funil.';

CREATE UNIQUE INDEX IF NOT EXISTS products_funnel_slug_unique
  ON public.products (funnel_slug)
  WHERE funnel_slug IS NOT NULL;

-- 2) Seed funil legado PADEL IQ PRO (slug = smartpadelstrategy, productTypes ebook/upsell)
INSERT INTO public.ebook_funnels (
  title,
  slug,
  ebook_price_cents,
  upsell_price_cents,
  ebook_product_type,
  upsell_product_type,
  stripe_ebook_name,
  stripe_upsell_name,
  languages,
  headline,
  subheadline,
  cta_label,
  status
)
VALUES (
  'PADEL IQ PRO: O SISTEMA TÁTICO DEFINITIVO',
  'smartpadelstrategy',
  3900,
  4900,
  'ebook',
  'upsell',
  'O Sistema de Posicionamento Completo para Jogadores de Padel Inteligentes',
  'O Sistema de Confiança no Padel - Mini-Curso em Vídeo',
  ARRAY['pt']::text[],
  'O Teu Braço é Bom, Mas a Tua Tática Está a Custar-te Jogos?',
  'Descobre o Sistema Tático Definitivo baseado na metodologia de lendas como Horacio Clementi e Manu Martin. Deixa de correr e começa a pensar.',
  'Quero Dominar o Court',
  'active'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  ebook_price_cents = EXCLUDED.ebook_price_cents,
  upsell_price_cents = EXCLUDED.upsell_price_cents,
  ebook_product_type = EXCLUDED.ebook_product_type,
  upsell_product_type = EXCLUDED.upsell_product_type,
  stripe_ebook_name = EXCLUDED.stripe_ebook_name,
  stripe_upsell_name = EXCLUDED.stripe_upsell_name,
  languages = EXCLUDED.languages,
  headline = EXCLUDED.headline,
  subheadline = EXCLUDED.subheadline,
  cta_label = EXCLUDED.cta_label,
  status = EXCLUDED.status,
  updated_at = now();

-- 3) Assets PT (paths existentes no bucket ebook-materials)
WITH f AS (
  SELECT id FROM public.ebook_funnels WHERE slug = 'smartpadelstrategy' LIMIT 1
)
INSERT INTO public.ebook_funnel_assets (
  funnel_id, language, kind, storage_path, public_url, file_name
)
SELECT
  f.id,
  v.language,
  v.kind,
  v.storage_path,
  v.public_url,
  v.file_name
FROM f
CROSS JOIN (
  VALUES
    (
      'pt',
      'ebook_pdf',
      'position ebook POR/POSICIONAMENTO_NO_PADEL.pdf',
      'https://gmpyjnufuvsoewbtirsg.supabase.co/storage/v1/object/public/ebook-materials/position%20ebook%20POR/POSICIONAMENTO_NO_PADEL.pdf',
      'POSICIONAMENTO_NO_PADEL.pdf'
    ),
    (
      'pt',
      'cheat_sheet',
      'position ebook POR/Cheat Sheet Padel POR.pdf',
      'https://gmpyjnufuvsoewbtirsg.supabase.co/storage/v1/object/public/ebook-materials/position%20ebook%20POR/Cheat%20Sheet%20Padel%20POR.pdf',
      'Cheat Sheet Padel POR.pdf'
    ),
    (
      'pt',
      'mental_cheat_sheet',
      'position ebook POR/Bonus upsell Cheat sheet mental POR.pdf',
      'https://gmpyjnufuvsoewbtirsg.supabase.co/storage/v1/object/public/ebook-materials/position%20ebook%20POR/Bonus%20upsell%20Cheat%20sheet%20mental%20POR.pdf',
      'Bonus upsell Cheat sheet mental POR.pdf'
    ),
    (
      'pt',
      'audio',
      'position ebook POR/audio pre-jogo.mp3',
      'https://gmpyjnufuvsoewbtirsg.supabase.co/storage/v1/object/public/ebook-materials/position%20ebook%20POR/audio%20pre-jogo.mp3',
      'audio pre-jogo.mp3'
    ),
    (
      'pt',
      'cover',
      'position ebook POR/ebook-cover-por.jpg',
      'https://gmpyjnufuvsoewbtirsg.supabase.co/storage/v1/object/public/ebook-materials/position%20ebook%20POR/ebook-cover-por.jpg',
      'ebook-cover-por.jpg'
    )
) AS v(language, kind, storage_path, public_url, file_name)
ON CONFLICT (funnel_id, language, kind) DO UPDATE SET
  storage_path = EXCLUDED.storage_path,
  public_url = EXCLUDED.public_url,
  file_name = EXCLUDED.file_name,
  updated_at = now();

-- 4) Ligar produto loja existente + Saber mais → landing rica
UPDATE public.products
SET
  funnel_slug = 'smartpadelstrategy',
  learn_more_url = 'https://boostpadel.store/smartpadelstrategy.html',
  active = true,
  is_digital = true,
  is_featured = true,
  updated_at = now()
WHERE id = '3e1bc969-36f4-4322-a4f7-6c50309312f7';

-- 5) Publicar funil "teste" na loja (se existir), Saber mais → funnel.html?slug=teste
INSERT INTO public.products (
  name,
  slug,
  price,
  stock,
  image_url,
  short_description,
  description,
  active,
  is_digital,
  is_featured,
  learn_more_url,
  funnel_slug,
  category_id
)
SELECT
  COALESCE(NULLIF(f.title, ''), 'Funil teste'),
  'ebook-funnel-teste',
  ROUND(f.ebook_price_cents / 100.0, 2),
  100,
  'https://gmpyjnufuvsoewbtirsg.supabase.co/storage/v1/object/public/ebook-materials/the%20padel%20iq%20logo.png',
  COALESCE(NULLIF(f.headline, ''), f.title),
  '<p>' || COALESCE(NULLIF(f.subheadline, ''), NULLIF(f.headline, ''), f.title) || '</p>',
  (f.status = 'active'),
  true,
  false,
  'https://boostpadel.store/funnel.html?slug=teste',
  'teste',
  '538a9bcb-248a-4bf8-898a-4cc15309a9d7'
FROM public.ebook_funnels f
WHERE f.slug = 'teste'
  AND NOT EXISTS (
    SELECT 1 FROM public.products p WHERE p.funnel_slug = 'teste'
  );

-- Se já existir produto com funnel_slug=teste, actualizar CTA
UPDATE public.products
SET
  learn_more_url = 'https://boostpadel.store/funnel.html?slug=teste',
  price = COALESCE(
    (SELECT ROUND(ebook_price_cents / 100.0, 2) FROM public.ebook_funnels WHERE slug = 'teste'),
    price
  ),
  active = true,
  is_digital = true,
  updated_at = now()
WHERE funnel_slug = 'teste';
