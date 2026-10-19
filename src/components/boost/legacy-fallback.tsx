import { ExternalLink } from 'lucide-react'
import { getDeepLink } from '@/lib/products/deep-links'

export function BoostLegacyFallback({ note }: { note?: string }) {
  const link = getDeepLink('boost')
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/80 px-4 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-200">Admin legacy (emergência)</p>
        <p className="text-xs text-slate-400">
          {note ||
            'Fluxos do dia-a-dia estão no hub (paridade 100%). Legacy só emergência técnica / Stripe Dashboard.'}
        </p>
      </div>
      <a
        href="/api/bridge/boost"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300"
      >
        Bridge <ExternalLink className="h-3.5 w-3.5" />
      </a>
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300"
      >
        Deep-link
      </a>
    </div>
  )
}
