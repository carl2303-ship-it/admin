'use client'

import type { PartnersDbCounts } from '@/lib/sportsevents/partners-counts'

export function PartnersDbBanner({ counts }: { counts: PartnersDbCounts }) {
  const tone = counts.ok
    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100'
    : 'border-amber-500/30 bg-amber-500/10 text-amber-100'

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tone}`}>
      <p className="font-semibold">
        Rede de parceiros (DB SportsEvents) — {counts.clubesPadel} CLUBE_PADEL
        {counts.total !== counts.clubesPadel
          ? ` · ${counts.total} parceiros no total`
          : ''}
      </p>
      <p className="mt-1 text-xs opacity-90">
        {counts.ok
          ? 'Lista lida directamente de public.partners — sem seed inventado.'
          : counts.error || 'Não foi possível contar parceiros na DB.'}
      </p>
    </div>
  )
}
