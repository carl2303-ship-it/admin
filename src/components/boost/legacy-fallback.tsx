import { ExternalLink } from 'lucide-react'
import { getDeepLink } from '@/lib/products/deep-links'

export function BoostLegacyFallback({ note }: { note?: string }) {
  const link = getDeepLink('boost')
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-sky-300 bg-sky-50/80 px-4 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sky-900">Admin legacy (fallback)</p>
        <p className="text-xs text-sky-800/80">
          {note ||
            'Blog, estágios, newsletter, ebooks e analytics ainda no admin.html.'}
        </p>
      </div>
      <a
        href="/api/bridge/boost"
        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-500"
      >
        Abrir via bridge <ExternalLink className="h-3.5 w-3.5" />
      </a>
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-50"
      >
        Deep-link
      </a>
    </div>
  )
}
