import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { getDeepLink } from '@/lib/products/deep-links'

/** Bridge de emergência — fluxo normal é o hub. */
export function SportsEventsLegacyFallback() {
  const link = getDeepLink('sportsevents')
  return (
    <p className="pt-4 text-center text-[11px] text-zinc-400">
      Emergência:{' '}
      <Link
        href="/api/bridge/sportsevents"
        className="font-semibold text-amber-700 hover:underline"
      >
        bridge Auth
      </Link>
      {' · '}
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 font-semibold text-zinc-500 hover:text-zinc-800"
      >
        {link.url.replace(/^https?:\/\//, '')}
        <ExternalLink className="h-3 w-3" />
      </a>
    </p>
  )
}
