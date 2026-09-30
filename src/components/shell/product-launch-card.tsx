import { ExternalLink } from 'lucide-react'
import type { LegacyDeepLink } from '@/lib/products/deep-links'

export function ProductLaunchCard({
  link,
  bridgeHref,
  bridgeNote,
}: {
  link: LegacyDeepLink
  bridgeHref: string
  bridgeNote?: string
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-zinc-900">
        {link.label}
      </h2>
      <p className="mt-2 text-sm text-zinc-500">{link.description}</p>
      {bridgeNote && (
        <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          {bridgeNote}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={bridgeHref}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Abrir via Hub (bridge)
          <ExternalLink className="h-4 w-4" />
        </a>
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          Deep-link directo
        </a>
      </div>
    </div>
  )
}
