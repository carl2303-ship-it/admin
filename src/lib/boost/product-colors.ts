/** Parse hub form `colors_json` → `boost.products.colors` jsonb rows. */

export type ProductColorRow = { name: string; hex: string }

/**
 * Keep rows with a hex even if name is blank (HUB-64).
 * Empty placeholder rows (no name + default black) are dropped.
 */
export function parseProductColors(raw: unknown[]): ProductColorRow[] {
  return raw
    .map((c, index) => {
      if (!c || typeof c !== 'object') return null
      const o = c as { name?: unknown; hex?: unknown }
      const colorName = String(o.name || '').trim()
      const hexRaw = String(o.hex || '').trim()
      const hex = hexRaw || '#000000'
      if (!colorName && (!hexRaw || hexRaw.toLowerCase() === '#000000')) {
        return null
      }
      return {
        name: colorName || `Cor ${index + 1}`,
        hex,
      }
    })
    .filter(Boolean) as ProductColorRow[]
}
