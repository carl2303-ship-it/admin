import { StatusPill, Panel, btnGhost } from '@/components/boost/ui'
import type { NetlifyEnvVisibility } from '@/lib/config/netlify-env'
import { cn } from '@/lib/utils'

const PRODUCT_LABEL: Record<string, string> = {
  boost: 'Boost',
  padel1: 'Padel1',
  sportsevents: 'SportsEvents',
  hub: 'Hub',
  shared: 'Partilhado',
}

export function NetlifyEnvPanel({
  visibility,
  title = 'Env Netlify (admin.sportsevents.app)',
  compact = false,
}: {
  visibility: NetlifyEnvVisibility
  title?: string
  compact?: boolean
}) {
  const keys = compact
    ? visibility.keys.filter((k) => !k.presentInRuntime).slice(0, 8)
    : visibility.keys

  return (
    <Panel>
      <div className="flex flex-col gap-2 border-b border-zinc-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold">{title}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Só presença / nomes — nunca valores. Runtime = este deploy; Netlify
            API = opcional com token.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill
            active={visibility.presentCount === visibility.totalCount}
            activeLabel={`${visibility.presentCount}/${visibility.totalCount} runtime`}
            inactiveLabel={`${visibility.presentCount}/${visibility.totalCount} runtime`}
          />
          <StatusPill
            active={visibility.apiConfigured && !visibility.apiError}
            activeLabel="Netlify API"
            inactiveLabel="Sem Netlify API"
          />
          {visibility.siteUiUrl && (
            <a
              href={visibility.siteUiUrl}
              target="_blank"
              rel="noreferrer"
              className={btnGhost}
            >
              Abrir Netlify env
            </a>
          )}
        </div>
      </div>

      {!visibility.apiConfigured && (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          Para listar keys no account Netlify: define{' '}
          <code className="rounded bg-amber-100 px-1">NETLIFY_AUTH_TOKEN</code>{' '}
          + <code className="rounded bg-amber-100 px-1">NETLIFY_ACCOUNT_ID</code>{' '}
          (+ opcional{' '}
          <code className="rounded bg-amber-100 px-1">NETLIFY_SITE_ID</code> /{' '}
          <code className="rounded bg-amber-100 px-1">NETLIFY_SITE_NAME</code>
          ). Escrita live de env = slice seguinte.
        </div>
      )}

      {visibility.apiError && (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          {visibility.apiError}
        </div>
      )}

      {compact && keys.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-zinc-500">
          Todas as env do catálogo estão presentes neste runtime.
        </p>
      ) : (
        <div className="divide-y divide-zinc-50">
          {keys.map((k) => (
            <div
              key={k.key}
              className="flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-semibold text-zinc-900">
                  {k.key}
                </p>
                <p className="text-[11px] text-zinc-500">
                  {k.label}
                  <span className="mx-1 text-zinc-300">·</span>
                  {PRODUCT_LABEL[k.product] || k.product}
                  {k.secret ? ' · secret' : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <StatusPill
                  active={k.presentInRuntime}
                  activeLabel="Runtime"
                  inactiveLabel="Runtime ✗"
                />
                {k.presentInNetlify !== null && (
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold',
                      k.presentInNetlify
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-zinc-100 text-zinc-500'
                    )}
                  >
                    {k.presentInNetlify ? 'Netlify' : 'Netlify ✗'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}
