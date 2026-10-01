import {
  ErrorBanner,
  Panel,
  StatusPill,
  TableShell,
  Th,
  Td,
  btnGhost,
  btnPrimary,
} from '@/components/boost/ui'
import { resolveConfigIntent } from '@/lib/config/actions'
import type { ConfigIntent } from '@/lib/config/queries'

export function ConfigIntentsTable({
  intents,
}: {
  intents:
    | { ok: true; data: ConfigIntent[] }
    | { ok: false; error: string; missingConfig?: boolean }
}) {
  return (
    <Panel>
      <div className="border-b border-zinc-100 px-4 py-3 font-bold">
        Intents de config (sem valores de secrets)
      </div>
      {!intents.ok ? (
        <div className="p-4">
          <ErrorBanner message={intents.error} />
          {intents.missingConfig && (
            <p className="mt-2 text-xs text-amber-800">
              Carlos: aplica a migration{' '}
              <code>
                20260930170000_create_hub_config_intents.sql
              </code>{' '}
              no Supabase SportsEvents.
            </p>
          )}
        </div>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Secret</Th>
              <Th>Estado</Th>
              <Th>Nota</Th>
              <Th>Criado</Th>
              <Th>Acção</Th>
            </tr>
          </thead>
          <tbody>
            {intents.data.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-zinc-500"
                >
                  Sem intents
                </td>
              </tr>
            )}
            {intents.data.map((row) => (
              <tr key={row.id}>
                <Td className="font-mono text-xs">{row.secret_name}</Td>
                <Td>
                  <StatusPill
                    active={row.status === 'applied'}
                    activeLabel="applied"
                    inactiveLabel={row.status}
                  />
                </Td>
                <Td className="max-w-[14rem] truncate text-xs text-zinc-500">
                  {row.note || '—'}
                </Td>
                <Td className="text-xs">
                  {new Date(row.created_at).toLocaleString('pt-PT')}
                </Td>
                <Td>
                  {row.status === 'pending' ? (
                    <div className="flex flex-wrap gap-1">
                      <form
                        action={async (fd) => {
                          'use server'
                          await resolveConfigIntent(fd)
                        }}
                      >
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="status" value="applied" />
                        <button type="submit" className={btnPrimary}>
                          Aplicado
                        </button>
                      </form>
                      <form
                        action={async (fd) => {
                          'use server'
                          await resolveConfigIntent(fd)
                        }}
                      >
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="status" value="cancelled" />
                        <button type="submit" className={btnGhost}>
                          Cancelar
                        </button>
                      </form>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400">—</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </Panel>
  )
}
