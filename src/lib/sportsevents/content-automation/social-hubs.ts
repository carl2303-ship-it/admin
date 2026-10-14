export const SOCIAL_HUBS = [
  'Algarve',
  'Marbella',
  'Barcelona',
  'General',
] as const

export type SocialHub = (typeof SOCIAL_HUBS)[number]

export function isSocialHub(v: string): v is SocialHub {
  return (SOCIAL_HUBS as readonly string[]).includes(v)
}

const HUB_HASHTAGS: Record<SocialHub, string> = {
  Algarve:
    '#padel #Algarve #Sportsevents #padelcamp #Portugal #padeltrip #padeltraining #clubcoach #padellife',
  Marbella:
    '#padel #Marbella #Sportsevents #padelcamp #Spain #CostaDelSol #padeltrip #padeltraining #clubcoach',
  Barcelona:
    '#padel #Barcelona #Sportsevents #padelcamp #Spain #padeltrip #padeltraining #clubcoach #padellife',
  General:
    '#padel #Sportsevents #padelcamp #padeltrip #padeltraining #Iberia #clubcoach #padellife',
}

/** Caption curta para posts só-redes (slogan + hashtags). */
export function buildSloganCaption(opts: {
  slogan: string
  hub: SocialHub
  extra?: string
  maxLength?: number
}): string {
  const max = opts.maxLength ?? 2200
  const slogan = opts.slogan.trim()
  const extra = (opts.extra || '').trim()
  const tags = HUB_HASHTAGS[opts.hub]
  const parts = [slogan]
  if (extra) parts.push(extra)
  parts.push(tags)
  const full = parts.join('\n\n')
  return full.length <= max ? full : full.slice(0, max - 1) + '…'
}
