'use client'

import { useState } from 'react'
import { seJson } from '@/lib/sportsevents/se-api'
import type { EnsureClubsResult } from '@/lib/sportsevents/ensure-european-clubs'

export function PartnersSeedBanner({ seed }: { seed: EnsureClubsResult }) {
  const [busy, setBusy] = useState(false)
  const [live, setLive] = useState(seed)

  async function reimport() {
    setBusy(true)
    const { ok, data } = await seJson<EnsureClubsResult>(
      '/api/se/partners/ensure-clubs',
      { method: 'POST' }
    )
    setBusy(false)
    if (ok || data.inserted > 0) {
      setLive({ ...data, ok: data.ok ?? ok })
      window.location.reload()
      return
    }
    setLive({
      ...live,
      ...data,
      ok: false,
      error: data.error || 'Falha no import',
    })
  }

  const ok = live.ok && live.clubesPadelAfter >= live.totalSeed
  const tone = ok
    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100'
    : 'border-amber-500/30 bg-amber-500/10 text-amber-100'

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-semibold">
            Clubes parceiros (legado) —{' '}
            {live.clubesPadelAfter}/{live.totalSeed} CLUBE_PADEL na DB
          </p>
          <p className="text-xs opacity-90">
            {ok
              ? `Seed OK${live.inserted ? ` · +${live.inserted} importados agora` : ''}.`
              : live.error ||
                'Lista incompleta. Usa «Importar agora» ou corre o SQL no Supabase SportsEvents.'}
          </p>
          {!live.serviceRole && (
            <p className="text-xs text-amber-200">
              Service role em falta no Netlify → corre{' '}
              <code className="text-cyan-300">
                docs/migrations/20261020090000_seed_european_padel_clubs.sql
              </code>{' '}
              no SQL Editor do projecto SE.
            </p>
          )}
          {live.errors?.length > 0 && (
            <ul className="mt-1 list-disc pl-4 text-[11px] text-red-300">
              {live.errors.slice(0, 3).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void reimport()}
          className="shrink-0 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
        >
          {busy ? 'A importar…' : 'Importar agora'}
        </button>
      </div>
    </div>
  )
}
