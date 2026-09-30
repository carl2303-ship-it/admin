export const HUB_ROLES = [
  'owner',
  'ops',
  'commerce',
  'platform',
  'content',
  'readonly',
] as const

export type HubRole = (typeof HUB_ROLES)[number]

export type HubProduct = 'boost' | 'padel1' | 'sportsevents' | 'content' | 'dashboard'

/** Permissões mínimas por área do shell. */
const ROLE_ACCESS: Record<HubRole, HubProduct[]> = {
  owner: ['dashboard', 'boost', 'padel1', 'sportsevents', 'content'],
  ops: ['dashboard', 'sportsevents', 'content'],
  commerce: ['dashboard', 'boost', 'sportsevents'],
  platform: ['dashboard', 'padel1'],
  content: ['dashboard', 'content', 'boost'],
  readonly: ['dashboard'],
}

export function roleCanAccess(role: HubRole, product: HubProduct): boolean {
  return ROLE_ACCESS[role]?.includes(product) ?? false
}

export function roleLabel(role: HubRole): string {
  const labels: Record<HubRole, string> = {
    owner: 'Owner',
    ops: 'Operações',
    commerce: 'Commerce',
    platform: 'Platform',
    content: 'Conteúdo',
    readonly: 'Só leitura',
  }
  return labels[role]
}
