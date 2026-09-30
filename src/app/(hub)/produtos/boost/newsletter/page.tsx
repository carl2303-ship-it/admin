import { redirect } from 'next/navigation'
import { requireBoostModule } from '@/lib/boost/auth'
import { listNewsletterSubscribers } from '@/lib/boost/queries'
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

export default async function BoostNewsletterPage() {
  const auth = await requireBoostModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }
  const result = await listNewsletterSubscribers()

  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  const activeEmails = result.data
    .filter((s) => s.active !== false)
    .map((s) => s.email)
    .join(',')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Newsletter
        </h2>
        <ExportButton
          label="Exportar emails activos"
          filename="newsletter-emails.txt"
          mime="text/plain;charset=utf-8"
          content={activeEmails}
        />
      </div>
      <Panel>
        <TableShell>
          <thead>
            <tr>
              <Th>Email</Th>
              <Th>Data</Th>
              <Th>Estado</Th>
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-zinc-500">
                  Sem subscritores
                </td>
              </tr>
            )}
            {result.data.map((s) => (
              <tr key={s.id}>
                <Td className="font-semibold">{s.email}</Td>
                <Td className="text-xs text-zinc-500">
                  {s.subscribed_at
                    ? new Date(s.subscribed_at).toLocaleString('pt-PT')
                    : '—'}
                </Td>
                <Td>
                  <StatusPill active={s.active !== false} />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>
    </div>
  )
}
