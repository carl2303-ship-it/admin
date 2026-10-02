/**
 * URL base da App Tour (padel-one-tour) em produção.
 *
 * Histórico: o legado Boost usava `https://tour.boostpadel.store`.
 * Domínio actual: `https://tour.padel1.app`.
 *
 * Override: `NEXT_PUBLIC_TOUR_APP_URL` (Netlify admin-padel).
 */

export const DEFAULT_TOUR_APP_URL = 'https://tour.padel1.app'

export function getTourAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_TOUR_APP_URL?.trim()
  if (!raw) return DEFAULT_TOUR_APP_URL
  return raw.replace(/\/+$/, '')
}

/** Login do organizador na App Tour (sem slug). */
export function getTourLoginUrl(): string {
  return getTourAppBaseUrl()
}

/**
 * Entrada branded do organizador: mesma App Tour com cores/tema
 * aplicados via slug no pathname (`organizationTheme` no padel-one-tour).
 * Não é um site marketing separado — era o que o email legado
 * chamava «Página pública» (`tour.boostpadel.store/{slug}`).
 */
export function getTourBrandedUrl(slug: string): string {
  const clean = slug.replace(/^\/+|\/+$/g, '')
  return `${getTourAppBaseUrl()}/${encodeURIComponent(clean)}`
}
