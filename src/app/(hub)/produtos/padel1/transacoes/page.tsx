import { redirect } from 'next/navigation'
import {
  requirePadel1Module,
  canWritePadel1,
  staffRole,
} from '@/lib/padel1/auth'
import {
  listClubsForSelect,
  listPlatformPayments,
  listPlayerTransactions,
} from '@/lib/padel1/queries'
import { TransactionsPanel } from '@/components/padel1/transactions-panel'
import { ConfigBanner, ErrorBanner } from '@/components/padel1/ui'

export default async function Padel1TransacoesPage() {
  const auth = await requirePadel1Module()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }
  const write = canWritePadel1(staffRole(auth.staff, auth.isBootstrap))
  const [txns, payments, clubs] = await Promise.all([
    listPlayerTransactions(),
    listPlatformPayments(),
    listClubsForSelect(),
  ])
  if (!txns.ok && txns.missingConfig) {
    return <ConfigBanner message={txns.error} />
  }
  if (!txns.ok) return <ErrorBanner message={txns.error} />
  if (!payments.ok) return <ErrorBanner message={payments.error} />
  if (!clubs.ok) return <ErrorBanner message={clubs.error} />

  return (
    <div className="space-y-3">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Transações
      </h2>
      <TransactionsPanel
        transactions={txns.data}
        payments={payments.data}
        clubs={clubs.data}
        canWrite={write}
      />
    </div>
  )
}
