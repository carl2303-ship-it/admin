import { ExternalLink } from 'lucide-react'
import { getDeepLink } from '@/lib/products/deep-links'

export function Padel1LegacyFallback({ note }: { note?: string }) {
  const link = getDeepLink('padel1')
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-zinc-800">HQ legacy (emergência)</p>
        <p className="text-xs text-zinc-600">
          {note ||
            'Fluxos HQ do dia-a-dia estão no hub. Manager de clube e Tour ficam nas apps cliente. Legacy só emergência.'}
        </p>
      </div>
      <a
        href="/api/bridge/padel1"
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
      >
        Bridge <ExternalLink className="h-3.5 w-3.5" />
      </a>
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
      >
        Deep-link HQ
      </a>
    </div>
  )
}
