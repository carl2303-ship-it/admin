import Link from 'next/link'
import { Panel } from '@/components/boost/ui'

type ChecklistItem = {
  id: string
  title: string
  detail: string
  href?: string
  external?: boolean
  doneHint?: string
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  {
    id: 'migration',
    title: 'Migration hub_config_intents no SE',
    detail:
      'Correr supabase/migrations/20260930170000_create_hub_config_intents.sql no project Supabase SportsEvents (SQL editor ou CLI). Sem isto, intents falham.',
    doneHint: 'Tabela pública hub_config_intents existe',
  },
  {
    id: 'pat',
    title: 'PAT Supabase no Netlify admin',
    detail:
      'Account → Access Tokens → colar em SUPABASE_ACCESS_TOKEN (ou BOOST_SUPABASE_ACCESS_TOKEN) + opcional BOOST_SUPABASE_PROJECT_REF. Activa write live de STRIPE_* no Edge Boost.',
    href: 'https://supabase.com/dashboard/account/tokens',
    external: true,
  },
  {
    id: 'netlify-api',
    title: 'Netlify API (opcional, fase 2)',
    detail:
      'NETLIFY_AUTH_TOKEN + NETLIFY_ACCOUNT_ID (+ NETLIFY_SITE_ID / NETLIFY_SITE_NAME) para o hub listar nomes de env do site admin. Escrita live de env = slice seguinte.',
    href: 'https://app.netlify.com/user/applications#personal-access-tokens',
    external: true,
  },
]

export function OpsChecklistBanner({
  items = DEFAULT_ITEMS,
  title = 'Checklist ops (Carlos)',
}: {
  items?: ChecklistItem[]
  title?: string
}) {
  return (
    <Panel className="border-amber-200 bg-gradient-to-br from-amber-50/80 to-white p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-800">
        Pós-merge / setup
      </p>
      <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold text-zinc-900">
        {title}
      </h3>
      <ol className="mt-3 space-y-3">
        {items.map((item, idx) => (
          <li key={item.id} className="flex gap-3 text-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-950">
              {idx + 1}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-zinc-900">{item.title}</p>
              <p className="mt-0.5 text-xs text-zinc-600">{item.detail}</p>
              {item.doneHint && (
                <p className="mt-1 text-[11px] text-emerald-700">
                  OK quando: {item.doneHint}
                </p>
              )}
              {item.href &&
                (item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs font-semibold text-sky-700 hover:underline"
                  >
                    Abrir
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="mt-1 inline-block text-xs font-semibold text-sky-700 hover:underline"
                  >
                    Ir
                  </Link>
                ))}
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
