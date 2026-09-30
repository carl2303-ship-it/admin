import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireBoostModule } from '@/lib/boost/auth'
import { listSaasLicenses } from '@/lib/boost/queries'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
  StatusPill,
  TableShell,
  Th,
  Td,
} from '@/components/boost/ui'

export default async function BoostContasPage() {
  const auth = await requireBoostModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }

  const result = await listSaasLicenses()
  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  return (
    <div className="space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Contas / utilizadores (Boost)
      </h2>
      <Panel className="p-5 text-sm text-zinc-600">
        <p className="font-semibold text-zinc-900">O que o admin.html permite</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            Login/logout na Auth Boost — <strong>sem</strong> CRUD de staff Boost
          </li>
          <li>
            Contas Tour criadas via{' '}
            <code>provision-saas-license</code> (owners das orgs{' '}
            <code>source=boost</code>)
          </li>
          <li>
            Compras/app-access criam users Boost via webhook Stripe (fora do
            admin UI)
          </li>
        </ul>
        <p className="mt-3">
          Equipa global do PADEL HUB (roles <code>hub_staff</code>):{' '}
          <Link href="/equipa" className="font-bold text-sky-700 hover:underline">
            /equipa
          </Link>
        </p>
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3">
          <p className="font-bold">Owners Tour (organizações Boost)</p>
          <Link
            href="/produtos/boost/saas"
            className="text-xs font-bold text-sky-700 hover:underline"
          >
            Gerir licenças / provisionar →
          </Link>
        </div>
        <TableShell>
          <thead>
            <tr>
              <Th>Organização</Th>
              <Th>Owner email</Th>
              <Th>Plano</Th>
              <Th>Estado</Th>
              <Th>Login Tour</Th>
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  Sem organizações
                </td>
              </tr>
            )}
            {result.data.map((o) => (
              <tr key={o.id}>
                <Td className="font-semibold">{o.name}</Td>
                <Td>{o.owner_email || '—'}</Td>
                <Td>{o.plan_type}</Td>
                <Td>{o.status}</Td>
                <Td>
                  <StatusPill
                    active={Boolean(o.tour_user_id)}
                    activeLabel="Provisionado"
                    inactiveLabel="Sem login"
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>
    </div>
  )
}
