/**
 * @deprecated Ícones canónicos em /public/brand/*.png (logo vermelho Admin hub).
 * Rotas /pwa-icon/* redirecionam para esses ficheiros.
 * Mantido só para imports legados — não embute bytes.
 */

export const ICON_V = '20261105'

export const brandIcon = {
  jpg: '/brand/admin-app-icon.jpg',
  png192: `/brand/icon-192.png?v=${ICON_V}`,
  png512: `/brand/icon-512.png?v=${ICON_V}`,
  apple: `/brand/apple-touch-icon.png?v=${ICON_V}`,
  favicon: `/favicon.ico?v=${ICON_V}`,
} as const
