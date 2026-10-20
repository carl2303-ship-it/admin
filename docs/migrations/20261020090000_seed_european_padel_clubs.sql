-- =============================================================================
-- OBSOLETO / NÃO CORRER
-- Seed inventado de 37 clubes — ERRADO.
-- Os clubes reais (~132 CLUBE_PADEL) JÁ existem em public.partners no projecto
-- SportsEvents (ref tprbpeacicadsbmvxcqk). O Hub lista-os via /api/se/data.
--
-- Verificação (SQL Editor):
--   SELECT count(*) FILTER (WHERE type::text = 'CLUBE_PADEL') AS clubes_padel,
--          count(*) AS total
--   FROM public.partners;
-- =============================================================================
-- Conteúdo abaixo mantido só como histórico — NÃO executar.
/*
-- =============================================================================
-- (histórico) SEED: 37 clubes europeus inventados — NÃO USAR
-- =============================================================================

BEGIN;

INSERT INTO public.partners (
  name, type, contact_name, email, phone, status, rating,
  country_code, country_name, city, region, address,
  courts_info, infrastructure, preferred_language, notes
)
SELECT
  'Padel Club San Siro',
  'CLUBE_PADEL',
  'Clube',
  'info@padelclubsansiro.it',
  '+39 02 4870 5313',
  'PROSPECAO',
  5,
  'IT',
  'Itália',
  'Milão',
  'Lombardia',
  'Via Terzaghi 2, 20148 Milano',
  '11 campos cobertos (Indoor)',
  'Balneários VIP, bar/restaurante, loja de padel e academia de treino.',
  'it',
  'Seed europeu — lista legado sportsevents.app/admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.partners p
  WHERE coalesce(p.type::text, '') = 'CLUBE_PADEL'
    AND lower(trim(p.name)) = lower(trim('Padel Club San Siro'))
    AND upper(coalesce(p.country_code, '')) = upper('IT')
);

INSERT INTO public.partners (
  name, type, contact_name, email, phone, status, rating,
  country_code, country_name, city, region, address,
  courts_info, infrastructure, preferred_language, notes
)
SELECT
  'Villa Pamphili Padel Club',
  'CLUBE_PADEL',
  'Clube',
  'padel@villapamphili.it',
  '+39 06 6615 8011',
  'PROSPECAO',
  5,
  'IT',
  'Itália',
  'Roma',
  'Lácio',
  'Via della Nocetta 107, 00164 Roma',
  '8 campos panorâmicos (Exteriores + Cobertos)',
  'Clube de luxo em complexo desportivo com piscina e ginásio.',
  'it',
  'Seed europeu — lista legado sportsevents.app/admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.partners p
  WHERE coalesce(p.type::text, '') = 'CLUBE_PADEL'
    AND lower(trim(p.name)) = lower(trim('Villa Pamphili Padel Club'))
    AND upper(coalesce(p.country_code, '')) = upper('IT')
);

INSERT INTO public.partners (
  name, type, contact_name, email, phone, status, rating,
  country_code, country_name, city, region, address,
  courts_info, infrastructure, preferred_language, notes
)
SELECT
  'Casa Padel',
  'CLUBE_PADEL',
  'Clube',
  'contact@casapadel.fr',
  '+33 1 84 21 03 90',
  'PROSPECAO',
  5,
  'FR',
  'França',
  'Saint-Denis',
  'Paris',
  '103 Rue Charles Michels, 93200 Saint-Denis',
  '12 campos cobertos (Indoor)',
  'Centro de alto rendimento, osteopatia, ginásio e restaurante gastronómico.',
  'fr',
  'Seed europeu — lista legado sportsevents.app/admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.partners p
  WHERE coalesce(p.type::text, '') = 'CLUBE_PADEL'
    AND lower(trim(p.name)) = lower(trim('Casa Padel'))
    AND upper(coalesce(p.country_code, '')) = upper('FR')
);

INSERT INTO public.partners (
  name, type, contact_name, email, phone, status, rating,
  country_code, country_name, city, region, address,
  courts_info, infrastructure, preferred_language, notes
)
SELECT
  'Pyramides Club',
  'CLUBE_PADEL',
  'Clube',
  'padel@les-pyramides.com',
  '+33 1 39 69 18 10',
  'PROSPECAO',
  5,
  'FR',
  'França',
  'Le Port-Marly',
  'Grande Paris',
  '16 Avenue de Saint-Germain, 78560 Le Port-Marly',
  '9 campos (Indoor e Outdoor)',
  'Um dos clubes mais prestigiados da França — ténis, golfe e eventos corporate.',
  'fr',
  'Seed europeu — lista legado sportsevents.app/admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.partners p
  WHERE coalesce(p.type::text, '') = 'CLUBE_PADEL'
    AND lower(trim(p.name)) = lower(trim('Pyramides Club'))
    AND upper(coalesce(p.country_code, '')) = upper('FR')
);

INSERT INTO public.partners (
  name, type, contact_name, email, phone, status, rating,
  country_code, country_name, city, region, address,
  courts_info, infrastructure, preferred_language, notes
)
SELECT
  'Mas Padel Club',
  'CLUBE_PADEL',
  'Clube',
  'lemaspadel@gmail.com',
  '+33 4 68 54 01 84',
  'PROSPECAO',
  5,
  'FR',
  'França',
  'Perpignan',
  'Occitânia',
  'Route de Elne, 66000 Perpignan',
  '10 campos panorâmicos',
  'Forte tradição de torneios no sul de França e organização de grupos de viagem.',
  'fr',
  'Seed europeu — lista legado sportsevents.app/admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.partners p
  WHERE coalesce(p.type::text, '') = 'CLUBE_PADEL'
    AND lower(trim(p.name)) = lower(trim('Mas Padel Club'))
    AND upper(coalesce(p.country_code, '')) = upper('FR')
);

INSERT INTO public.partners (
  name, type, contact_name, email, phone, status, rating,
  country_code, country_name, city, region, address,
  courts_info, infrastructure, preferred_language, notes
)
SELECT
  'Rocket Padel Bristol',
  'CLUBE_PADEL',
  'Clube',
  'bristol@rocketpadel.com',
  '+44 117 450 4900',
  'PROSPECAO',
  5,
  'GB',
  'Reino Unido',
  'Bristol',
  'Inglaterra',
  'St Anne''s Park, Bristol BS4 4ED',
  '14 campos cobertos (um dos maiores centros indoor do UK)',
  'Lounge bar, pro shop, zona de espetadores e bar de sumos/nutrição.',
  'en',
  'Seed europeu — lista legado sportsevents.app/admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.partners p
  WHERE coalesce(p.type::text, '') = 'CLUBE_PADEL'
    AND lower(trim(p.name)) = lower(trim('Rocket Padel Bristol'))
    AND upper(coalesce(p.country_code, '')) = upper('GB')
);

INSERT INTO public.partners (
  name, type, contact_name, email, phone, status, rating,
  country_code, country_name, city, region, address,
  courts_info, infrastructure, preferred_language, notes
)
SELECT
  'Stratford Padel Club',
  'CLUBE_PADEL',
  'Clube',
  'info@stratfordpadelclub.org',
  '+44 7919 026218',
  'PROSPECAO',
  5,
  'GB',
  'Reino Unido',
  'Londres',
  'Inglaterra',
  '221 High St, London E15 2LS',
  '5 campos cobertos + zona de treino',
  'Clube pioneiro em Londres com grande comunidade e liga interna ativa.',
  'en',
  'Seed europeu — lista legado sportsevents.app/admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.partners p
  WHERE coalesce(p.type::text, '') = 'CLUBE_PADEL'
    AND lower(trim(p.name)) = lower(trim('Stratford Padel Club'))
    AND upper(coalesce(p.country_code, '')) = upper('GB')
);

INSERT INTO public.partners (
  name, type, contact_name, email, phone, status, rating,
  country_code, country_name, city, region, address,
  courts_info, infrastructure, preferred_language, notes
)
SELECT
  'Game4Padel',
  'CLUBE_PADEL',
  'Clube',
  'info@game4padel.com',
  '+44 131 370 8888',
  'PROSPECAO',
  5,
  'GB',
  'Reino Unido',
  'Edimburgo',
  'Edimburgo & Londres (rede nacional)',
  'Thistle Tennis Club, Kintore Place, Edinburgh EH7 5TZ',
  'Rede de +20 campos no Reino Unido',
  'Gestora de clubes com foco em viagens e parcerias internacionais.',
  'en',
  'Seed europeu — lista legado sportsevents.app/admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.partners p
  WHERE coalesce(p.type::text, '') = 'CLUBE_PADEL'
    AND lower(trim(p.name)) = lower(trim('Game4Padel'))
    AND upper(coalesce(p.country_code, '')) = upper('GB')
);

INSERT INTO public.partners (
  name, type, contact_name, email, phone, status, rating,
  country_code, country_name, city, region, address,
  courts_info, infrastructure, preferred_language, notes
)
SELECT
  'Padel First',
  'CLUBE_PADEL',
  'Clube',
  'contact@padelfirst.ch',
  '+41 22 341 41 41',
  'PROSPECAO',
  5,
  'CH',
  'Suíça',
  'Vernier',
  'Genebra',
  'Chemin de la Salienne 12, 1214 Vernier',
  '6 campos cobertos',
  'Academia de treino para adultos, balneários de luxo e bar lounge.',
  'de',
  'Seed europeu — lista legado sportsevents.app/admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.partners p
  WHERE coalesce(p.type::text, '') = 'CLUBE_PADEL'
    AND lower(trim(p.name)) = lower(trim('Padel First'))
    AND upper(coalesce(p.country_code, '')) = upper('CH')
);

INSERT INTO public.partners (
  name, type, contact_name, email, phone, status, rating,
  country_code, country_name, city, region, address,
  courts_info, infrastructure, preferred_language, notes
)
SELECT
  'PDL Center Zug',
  'CLUBE_PADEL',
  'Clube',
  'zug@pdlcenter.ch',
  '+41 41 790 90 00',
  'PROSPECAO',
  5,
  'CH',
  'Suíça',
  'Rotkreuz',
  'Zurique / Zug',
  'Industriestrasse 12, 6343 Rotkreuz',
  '8 campos cobertos',
  'Centro moderno com pavimento oficial World Padel Tour e comunidade VIP.',
  'de',
  'Seed europeu — lista legado sportsevents.app/admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.partners p
  WHERE coalesce(p.type::text, '') = 'CLUBE_PADEL'
    AND lower(trim(p.name)) = lower(trim('PDL Center Zug'))
    AND upper(coalesce(p.country_code, '')) = upper('CH')
);

*/
-- Fim do bloco histórico — NÃO executar o seed acima.

-- Verificação segura (só SELECT):
SELECT
  count(*) FILTER (WHERE type::text = 'CLUBE_PADEL') AS clubes_padel,
  count(*) AS total
FROM public.partners;
