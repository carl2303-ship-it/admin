import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireBoostModule } from '@/lib/boost/auth'
import { getBoostAnalytics } from '@/lib/boost/queries'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
  TableShell,
  Th,
  Td,
  btnGhost,
  fieldClass,
} from '@/components/boost/ui'

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-zinc-400">—</span>
  const up = value >= 0
  return (
    <span className={`text-xs font-semibold ${up ? 'text-emerald-600' : 'text-red-600'}`}>
      {up ? '↑' : '↓'} {Math.abs(value).toFixed(1)}% vs período anterior
    </span>
  )
}

export default async function BoostAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; compare?: string }>
}) {
  const sp = await searchParams
  const period = sp.period || 'month'
  const compare = sp.compare || 'previous'

  const auth = await requireBoostModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }

  const result = await getBoostAnalytics({ period, compare })
  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  const a = result.data

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Analytics
        </h2>
        <form className="flex flex-wrap items-end gap-2" method="get">
          <label className="block space-y-1">
            <span className="text-[10px] font-bold uppercase text-zinc-500">
              Período
            </span>
            <select name="period" defaultValue={period} className={fieldClass}>
              <option value="week">Semana</option>
              <option value="month">Mês</option>
              <option value="quarter">Trimestre</option>
              <option value="year">Ano</option>
              <option value="all">Tudo</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-bold uppercase text-zinc-500">
              Comparar
            </span>
            <select name="compare" defaultValue={compare} className={fieldClass}>
              <option value="previous">Período anterior</option>
              <option value="year">Ano anterior</option>
              <option value="none">Sem comparação</option>
            </select>
          </label>
          <button type="submit" className={btnGhost}>
            Actualizar
          </button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Receita', `€${a.revenue.toFixed(2)}`, a.revenueChange],
          ['Vendas', String(a.sales), a.salesChange],
          ['Ticket médio', `€${a.avgTicket.toFixed(2)}`, a.avgChange],
          ['Clientes', String(a.customers), a.customersChange],
        ].map(([label, value, change]) => (
          <Panel key={String(label)} className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {label}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
              {value}
            </p>
            <div className="mt-1">
              <Change value={change as number | null} />
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="p-5">
        <h3 className="font-bold">Licenças Tour (SaaS)</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-zinc-500">Activas</p>
            <p className="text-xl font-bold">{a.saas.active}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">MRR estimado</p>
            <p className="text-xl font-bold">€{a.saas.mrr.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Em risco</p>
            <p className="text-xl font-bold">{a.saas.atRisk}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Novas no período</p>
            <p className="text-xl font-bold">{a.saas.newInPeriod}</p>
            <Change value={a.saas.newChange} />
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {Object.entries(a.saas.byPlan).map(([plan, count]) => (
            <div
              key={plan}
              className="rounded-xl bg-zinc-50 px-3 py-2 text-sm"
            >
              <p className="text-[10px] font-bold uppercase text-zinc-500">
                {plan}
              </p>
              <p className="text-lg font-bold">{count}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs">
          <Link href="/produtos/boost/saas" className="font-bold text-sky-700 hover:underline">
            Gerir licenças →
          </Link>
        </p>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h3 className="font-bold">Top 5 produtos</h3>
          {a.topProducts.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">
              Sem dados de `order.items` no período (analytics Boost usa items
              embutidos na encomenda).
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {a.topProducts.map((p) => (
                <li key={p.name} className="flex justify-between gap-3">
                  <span>
                    {p.name}{' '}
                    <span className="text-zinc-400">×{p.quantity}</span>
                  </span>
                  <span className="font-semibold">€{p.revenue.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <div className="border-b border-zinc-100 px-4 py-3 font-bold">
            Vendas diárias
          </div>
          <TableShell>
            <thead>
              <tr>
                <Th>Data</Th>
                <Th>Vendas</Th>
                <Th>Receita</Th>
                <Th>Ticket</Th>
              </tr>
            </thead>
            <tbody>
              {a.daily.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-zinc-500"
                  >
                    Sem vendas
                  </td>
                </tr>
              )}
              {a.daily.slice(0, 31).map((d) => (
                <tr key={d.date}>
                  <Td className="text-xs">{d.date}</Td>
                  <Td>{d.sales}</Td>
                  <Td className="font-semibold">€{d.revenue.toFixed(2)}</Td>
                  <Td>€{d.avg.toFixed(2)}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </Panel>
      </div>
    </div>
  )
}
