import { redirect } from 'next/navigation'
import { requireBoostModule } from '@/lib/boost/auth'
import { listEbookLeads } from '@/lib/boost/queries'
import { ExportButton } from '@/components/boost/export-button'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
  StatusPill,
  TableShell,
  Th,
  Td,
} from '@/components/boost/ui'

export default async function BoostEbookLeadsPage() {
  const auth = await requireBoostModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }
  const result = await listEbookLeads()

  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  const leads = result.data
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const kpis = {
    total: leads.length,
    newsletter: leads.filter((l) => l.newsletter_opt_in).length,
    downloads: leads.reduce((s, l) => s + Number(l.download_count || 0), 0),
    recent: leads.filter((l) => new Date(l.created_at).getTime() >= sevenDaysAgo)
      .length,
  }

  const csv = [
    ['Nome', 'Email', 'Telemóvel', 'Newsletter', 'Downloads', 'Data'].join(','),
    ...leads.map((l) =>
      [
        l.name || '',
        l.email,
        l.phone || '',
        l.newsletter_opt_in ? 'Sim' : 'Não',
        l.download_count ?? 0,
        new Date(l.created_at).toLocaleDateString('pt-PT'),
      ].join(',')
    ),
  ].join('\n')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Leads Ebook
        </h2>
        <ExportButton
          label="Exportar CSV"
          filename={`ebook-leads-${new Date().toISOString().slice(0, 10)}.csv`}
          content={csv}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Total leads', kpis.total],
          ['Opt-in newsletter', kpis.newsletter],
          ['Downloads', kpis.downloads],
          ['Últimos 7 dias', kpis.recent],
        ].map(([label, value]) => (
          <Panel key={String(label)} className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {label}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
              {value}
            </p>
          </Panel>
        ))}
      </div>
      <Panel>
        <TableShell>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Email</Th>
              <Th>Telefone</Th>
              <Th>Downloads</Th>
              <Th>Newsletter</Th>
              <Th>Data</Th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  Sem leads
                </td>
              </tr>
            )}
            {leads.map((l) => (
              <tr key={l.id}>
                <Td className="font-semibold">{l.name || '—'}</Td>
                <Td>{l.email}</Td>
                <Td>{l.phone || '—'}</Td>
                <Td>
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
                    {l.download_count ?? 0}x
                  </span>
                </Td>
                <Td>
                  <StatusPill
                    active={Boolean(l.newsletter_opt_in)}
                    activeLabel="Sim"
                    inactiveLabel="Não"
                  />
                </Td>
                <Td className="text-xs text-zinc-500">
                  {new Date(l.created_at).toLocaleDateString('pt-PT')}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>
    </div>
  )
}
