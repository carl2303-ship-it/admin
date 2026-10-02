'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { generateEbookFunnelLanding } from '@/lib/boost/actions'
import type {
  BoostEbookFunnel,
  EbookFunnelLandingBody,
} from '@/lib/boost/types'
import { EBOOK_FUNNEL_LANGUAGES } from '@/lib/boost/types'
import { btnPrimary, fieldClass } from './ui'

const TONES = [
  { value: 'direto', label: 'Direto / conversão' },
  { value: 'premium', label: 'Premium / coaching' },
  { value: 'amigavel', label: 'Amigável / motivacional' },
  { value: 'tecnico', label: 'Técnico / táctico' },
] as const

export function FunnelAiLanding({
  funnel,
  canWrite,
}: {
  funnel: BoostEbookFunnel
  canWrite: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const body = (funnel.landing_body || {}) as EbookFunnelLandingBody

  if (!canWrite) {
    return (
      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
          Gerar landing com AI
        </h3>
        <p className="text-sm text-zinc-500">Sem permissão de escrita.</p>
        {body.benefits?.length ? (
          <ul className="list-inside list-disc text-sm text-zinc-700">
            {body.benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : null}
      </div>
    )
  }

  return (
    <form
      className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      action={(fd) => {
        start(async () => {
          setError(null)
          setOkMsg(null)
          const result = await generateEbookFunnelLanding(fd)
          if (!result.ok) {
            setError(result.error)
            return
          }
          setOkMsg(result.message || 'Landing gerada e guardada.')
          router.refresh()
        })
      }}
    >
      <input type="hidden" name="funnel_id" value={funnel.id} />
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
        Gerar landing com AI
      </h3>
      <p className="text-sm text-zinc-500">
        Descreve o conteúdo do PDF/ebook e, opcionalmente, envia fotos. A AI
        gera headline, subheadline, CTA e benefícios — gravados neste funil e
        mostrados em{' '}
        <code className="rounded bg-zinc-100 px-1">funnel.html?slug=…</code>.
      </p>

      <label className="block space-y-1">
        <span className="text-xs font-bold uppercase text-zinc-500">
          Descrição do conteúdo do PDF
        </span>
        <textarea
          name="description"
          required
          rows={5}
          placeholder="Ex.: Ebook de 40 páginas sobre posicionamento em padel para intermediários — inclui mapas de campo, erros comuns e drills…"
          defaultValue={body.source_description || ''}
          className={fieldClass}
        />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Tom
          </span>
          <select
            name="tone"
            defaultValue={body.tone || 'direto'}
            className={fieldClass}
          >
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Idioma da landing
          </span>
          <select
            name="language"
            defaultValue={body.language || funnel.languages?.[0] || 'pt'}
            className={fieldClass}
          >
            {EBOOK_FUNNEL_LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {code.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-bold uppercase text-zinc-500">
          Fotos (opcional — bucket ebook-materials)
        </span>
        <input
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-sky-800"
        />
        {body.images?.length ? (
          <p className="text-xs text-zinc-500">
            Já há {body.images.length} imagem(ns) na landing gerada.
          </p>
        ) : null}
      </label>

      {body.benefits?.length ? (
        <div className="rounded-xl bg-zinc-50 p-3 text-sm">
          <p className="mb-1 font-semibold text-zinc-800">
            Benefícios actuais
          </p>
          <ul className="list-inside list-disc text-zinc-700">
            {body.benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {body.generated_at ? (
            <p className="mt-2 text-xs text-zinc-400">
              Gerado: {new Date(body.generated_at).toLocaleString('pt-PT')}
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {okMsg ? <p className="text-sm text-emerald-700">{okMsg}</p> : null}

      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? 'A gerar…' : 'Gerar e guardar landing'}
      </button>
    </form>
  )
}
