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
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
        {link.label}
      </h2>
      <p className="mt-2 text-sm text-slate-400">{link.description}</p>
      {bridgeNote && (
        <p className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-400">
          {bridgeNote}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={bridgeHref}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500"
        >
          Abrir via Hub (bridge)
          <ExternalLink className="h-4 w-4" />
        </a>
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-900"
        >
          Deep-link directo
        </a>
      </div>
    </div>
  )
}
