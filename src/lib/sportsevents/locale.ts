/** Subconjunto i18n SE usado por hub_packages (sem proxy de locale do site). */
export const locales = ['en', 'pt', 'es', 'fr', 'de'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
