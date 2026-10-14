export const HUB_DESTINATION_CODES = ['ALG', 'ALGARVE', 'BCN', 'MAR', 'MRB'] as const

export function isHubDestination(code?: string | null) {
  if (!code) return false
  return (HUB_DESTINATION_CODES as readonly string[]).includes(code)
}

export function filterHubDestinations<T extends { code?: string | null; name?: string | null }>(
  destinations: T[]
) {
  const hubs = destinations.filter((d) => isHubDestination(d.code))
  // Prefer ALG over ALGARVE, MAR over MRB if duplicates
  const preferred = ['ALG', 'BCN', 'MAR']
  const byCode = new Map<string, T>()
  for (const d of hubs) {
    const code = d.code || ''
    if (code === 'ALGARVE' && byCode.has('ALG')) continue
    if (code === 'MRB' && byCode.has('MAR')) continue
    if (code === 'ALG' || code === 'BCN' || code === 'MAR') {
      byCode.set(code, d)
    } else if (!preferred.some((p) => byCode.has(p) && related(p, code))) {
      byCode.set(code === 'ALGARVE' ? 'ALG' : code === 'MRB' ? 'MAR' : code, d)
    }
  }
  return preferred.map((c) => byCode.get(c)).filter(Boolean) as T[]
}

function related(preferred: string, code: string) {
  if (preferred === 'ALG') return code === 'ALGARVE'
  if (preferred === 'MAR') return code === 'MRB'
  return false
}

export function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 140)
}
