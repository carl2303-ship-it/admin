/** Constantes do funil legado PADEL IQ PRO (smartpadelstrategy). PT only. */

export const STORE_BASE_DEFAULT = 'https://boostpadel.store'

export const LEGACY_PADEL_IQ = {
  title: 'PADEL IQ PRO: O SISTEMA TÁTICO DEFINITIVO',
  slug: 'smartpadelstrategy',
  ebook_price_cents: 3900,
  upsell_price_cents: 4900,
  ebook_product_type: 'ebook',
  upsell_product_type: 'upsell',
  stripe_ebook_name:
    'O Sistema de Posicionamento Completo para Jogadores de Padel Inteligentes',
  stripe_upsell_name:
    'O Sistema de Confiança no Padel - Mini-Curso em Vídeo',
  languages: ['pt'] as string[],
  headline:
    'O Teu Braço é Bom, Mas a Tua Tática Está a Custar-te Jogos?',
  subheadline:
    'Descobre o Sistema Tático Definitivo baseado na metodologia de lendas como Horacio Clementi e Manu Martin. Deixa de correr e começa a pensar.',
  cta_label: 'Quero Dominar o Court',
  status: 'active' as const,
  store_product_id: '3e1bc969-36f4-4322-a4f7-6c50309312f7',
  store_category_id: '538a9bcb-248a-4bf8-898a-4cc15309a9d7',
  legacy_landing_path: '/smartpadelstrategy.html',
  legacy_upsell_path: '/ebook-upsell.html',
  legacy_thank_you_path: '/ebook-thank-you.html',
  legacy_upsell_thank_you_path: '/ebook-upsell-thank-you.html',
  cover_public_url:
    'https://gmpyjnufuvsoewbtirsg.supabase.co/storage/v1/object/public/ebook-materials/position%20ebook%20POR/ebook-cover-por.jpg',
  assets_pt: [
    {
      kind: 'ebook_pdf',
      storage_path: 'position ebook POR/POSICIONAMENTO_NO_PADEL.pdf',
      public_url:
        'https://gmpyjnufuvsoewbtirsg.supabase.co/storage/v1/object/public/ebook-materials/position%20ebook%20POR/POSICIONAMENTO_NO_PADEL.pdf',
      file_name: 'POSICIONAMENTO_NO_PADEL.pdf',
    },
    {
      kind: 'cheat_sheet',
      storage_path: 'position ebook POR/Cheat Sheet Padel POR.pdf',
      public_url:
        'https://gmpyjnufuvsoewbtirsg.supabase.co/storage/v1/object/public/ebook-materials/position%20ebook%20POR/Cheat%20Sheet%20Padel%20POR.pdf',
      file_name: 'Cheat Sheet Padel POR.pdf',
    },
    {
      kind: 'mental_cheat_sheet',
      storage_path:
        'position ebook POR/Bonus upsell Cheat sheet mental POR.pdf',
      public_url:
        'https://gmpyjnufuvsoewbtirsg.supabase.co/storage/v1/object/public/ebook-materials/position%20ebook%20POR/Bonus%20upsell%20Cheat%20sheet%20mental%20POR.pdf',
      file_name: 'Bonus upsell Cheat sheet mental POR.pdf',
    },
    {
      kind: 'audio',
      storage_path: 'position ebook POR/audio pre-jogo.mp3',
      public_url:
        'https://gmpyjnufuvsoewbtirsg.supabase.co/storage/v1/object/public/ebook-materials/position%20ebook%20POR/audio%20pre-jogo.mp3',
      file_name: 'audio pre-jogo.mp3',
    },
    {
      kind: 'cover',
      storage_path: 'position ebook POR/ebook-cover-por.jpg',
      public_url:
        'https://gmpyjnufuvsoewbtirsg.supabase.co/storage/v1/object/public/ebook-materials/position%20ebook%20POR/ebook-cover-por.jpg',
      file_name: 'ebook-cover-por.jpg',
    },
  ],
} as const

export function storeBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BOOST_STORE_URL?.replace(/\/$/, '') ||
    STORE_BASE_DEFAULT
  )
}

export function funnelPublicUrls(slug: string) {
  const base = storeBaseUrl()
  const q = encodeURIComponent(slug)
  return {
    landing: `${base}/funnel.html?slug=${q}`,
    upsell: `${base}/funnel-upsell.html?slug=${q}`,
    thankYou: `${base}/funnel-thank-you.html?slug=${q}`,
  }
}

export function legacyPadelIqUrls() {
  const base = storeBaseUrl()
  const L = LEGACY_PADEL_IQ
  return {
    landing: `${base}${L.legacy_landing_path}`,
    upsell: `${base}${L.legacy_upsell_path}`,
    thankYou: `${base}${L.legacy_thank_you_path}`,
    upsellThankYou: `${base}${L.legacy_upsell_thank_you_path}`,
    dynamic: funnelPublicUrls(L.slug),
  }
}
