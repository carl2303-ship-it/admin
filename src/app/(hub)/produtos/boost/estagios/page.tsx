import { redirect } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
import { listStageRegistrations } from '@/lib/boost/queries'
import { StageStatusSelect } from '@/components/boost/stage-status-select'
import { STAGE_TYPE_LABELS } from '@/lib/boost/types'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
  TableShell,
  Th,
  Td,
} from '@/components/boost/ui'

export default async function BoostStagesPage() {
  const auth = await requireBoostModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }
  const write = canWriteBoost(staffRole(auth.staff, auth.isBootstrap))
  const result = await listStageRegistrations()

  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  return (
    <div className="space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Inscrições estágios
      </h2>
      <p className="text-xs text-zinc-500">
        Lista Boost (`stage_registrations`). Fonte de verdade de eventos =
        SportsEvents (fase seguinte).
      </p>
      <Panel>
        <TableShell>
          <thead>
            <tr>
              <Th>Nº</Th>
              <Th>Cliente</Th>
              <Th>Tipo</Th>
              <Th>Data</Th>
              <Th>Preço</Th>
              <Th>Estado</Th>
              <Th>Contacto</Th>
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  Nenhuma inscrição
                </td>
              </tr>
            )}
            {result.data.map((s) => (
              <tr key={s.id}>
                <Td className="font-mono text-xs">
                  {s.registration_number || '—'}
                </Td>
                <Td>
                  <p className="font-semibold">{s.customer_name || '—'}</p>
                  <p className="text-xs text-zinc-400">{s.customer_email}</p>
                </Td>
                <Td>
                  {(s.stage_type && STAGE_TYPE_LABELS[s.stage_type]) ||
                    s.stage_type ||
                    '—'}
                </Td>
                <Td className="text-xs">
                  {s.stage_date
                    ? new Date(s.stage_date).toLocaleDateString('pt-PT')
                    : '—'}
                </Td>
                <Td className="font-bold">
                  €{Number(s.price ?? 0).toFixed(2)}
                </Td>
                <Td>
                  {write ? (
                    <StageStatusSelect stageId={s.id} status={s.status} />
                  ) : (
                    s.status
                  )}
                </Td>
                <Td>
                  {s.customer_phone ? (
                    <a
                      href={`tel:${s.customer_phone}`}
                      className="text-xs font-bold text-sky-700 hover:underline"
                    >
                      Contactar
                    </a>
                  ) : (
                    '—'
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>
    </div>
  )
}
