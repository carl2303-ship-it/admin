'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { injectPlayerTransaction } from '@/lib/padel1/actions'
import type {
  Padel1PlatformPayment,
  Padel1PlayerTransaction,
} from '@/lib/padel1/types'
import { TXN_TYPE_LABELS } from '@/lib/padel1/types'
import {
  btnGhost,
  btnPrimary,
  fieldClass,
  Panel,
  TableShell,
  Td,
  Th,
} from './ui'

export function TransactionsPanel({
  transactions,
  payments,
  clubs,
  canWrite,
}: {
  transactions: Padel1PlayerTransaction[]
  payments: Padel1PlatformPayment[]
  clubs: { id: string; owner_id: string | null; name: string }[]
  canWrite: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [tab, setTab] = useState<'player' | 'platform'>('player')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showInject, setShowInject] = useState(false)
  const [inject, setInject] = useState({
    clubOwnerId: '',
    playerName: '',
    playerPhone: '',
    amount: '',
    notes: '',
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return transactions
      .filter((t) => {
        if (filterType !== 'all' && t.transaction_type !== filterType)
          return false
        if (!q) return true
        return (
          t.player_name.toLowerCase().includes(q) ||
          (t.player_phone || '').includes(q) ||
          (t.notes || '').toLowerCase().includes(q)
        )
      })
      .slice(0, 200)
  }, [transactions, search, filterType])

  const clubsWithOwner = clubs.filter((c) => c.owner_id)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={tab === 'player' ? btnPrimary : btnGhost}
          onClick={() => setTab('player')}
        >
          Jogadores
        </button>
        <button
          type="button"
          className={tab === 'platform' ? btnPrimary : btnGhost}
          onClick={() => setTab('platform')}
        >
          Plataforma
        </button>
        {canWrite && tab === 'player' && (
          <button
            type="button"
            className={btnGhost}
            onClick={() => setShowInject((v) => !v)}
          >
            Injectar ajuste
          </button>
        )}
      </div>

      {showInject && canWrite && (
        <Panel className="space-y-2 p-4">
          <select
            className={fieldClass}
            value={inject.clubOwnerId}
            onChange={(e) =>
              setInject({ ...inject, clubOwnerId: e.target.value })
            }
          >
            <option value="">Clube (owner)</option>
            {clubsWithOwner.map((c) => (
              <option key={c.id} value={c.owner_id!}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className={fieldClass}
              placeholder="Nome jogador"
              value={inject.playerName}
              onChange={(e) =>
                setInject({ ...inject, playerName: e.target.value })
              }
            />
            <input
              className={fieldClass}
              placeholder="Telefone"
              value={inject.playerPhone}
              onChange={(e) =>
                setInject({ ...inject, playerPhone: e.target.value })
              }
            />
            <input
              className={fieldClass}
              placeholder="Valor €"
              value={inject.amount}
              onChange={(e) =>
                setInject({ ...inject, amount: e.target.value })
              }
            />
            <input
              className={fieldClass}
              placeholder="Notas"
              value={inject.notes}
              onChange={(e) =>
                setInject({ ...inject, notes: e.target.value })
              }
            />
          </div>
          <button
            type="button"
            className={btnPrimary}
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await injectPlayerTransaction({
                  clubOwnerId: inject.clubOwnerId,
                  playerName: inject.playerName,
                  playerPhone: inject.playerPhone,
                  amount: Number(inject.amount) || 0,
                  notes: inject.notes,
                })
                if (!r.ok) window.alert(r.error)
                else {
                  setShowInject(false)
                  router.refresh()
                }
              })
            }
          >
            Guardar ajuste
          </button>
        </Panel>
      )}

      {tab === 'player' && (
        <>
          <div className="flex flex-wrap gap-2">
            <input
              className={`${fieldClass} max-w-xs`}
              placeholder="Pesquisar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={`${fieldClass} max-w-[180px]`}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Todos tipos</option>
              {Object.entries(TXN_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <Panel>
            <TableShell>
              <thead>
                <tr>
                  <Th>Data</Th>
                  <Th>Jogador</Th>
                  <Th>Tipo</Th>
                  <Th>Valor</Th>
                  <Th>Notas</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <Td>
                      {new Date(t.transaction_date).toLocaleDateString('pt-PT')}
                    </Td>
                    <Td>
                      <div className="font-semibold">{t.player_name}</div>
                      <div className="text-xs text-zinc-500">
                        {t.player_phone}
                      </div>
                    </Td>
                    <Td>
                      {TXN_TYPE_LABELS[t.transaction_type] ||
                        t.transaction_type}
                    </Td>
                    <Td>€{Number(t.amount).toFixed(2)}</Td>
                    <Td className="max-w-[200px] truncate text-zinc-500">
                      {t.notes || '—'}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </Panel>
        </>
      )}

      {tab === 'platform' && (
        <Panel>
          <TableShell>
            <thead>
              <tr>
                <Th>Data</Th>
                <Th>Pagador</Th>
                <Th>Tipo</Th>
                <Th>Valor</Th>
                <Th>Estado</Th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <Td>
                    {new Date(p.created_at).toLocaleDateString('pt-PT')}
                  </Td>
                  <Td>
                    <div className="font-semibold">
                      {p.payer_name || '—'}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {p.payer_email}
                    </div>
                  </Td>
                  <Td>{p.target_type}</Td>
                  <Td>
                    €{Number(p.amount).toFixed(2)} {p.currency}
                  </Td>
                  <Td>{p.status}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </Panel>
      )}
    </div>
  )
}
