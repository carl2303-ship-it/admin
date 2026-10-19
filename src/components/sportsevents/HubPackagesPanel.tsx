'use client'

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  CheckCircle2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import {
  formatEuro,
  lowestAvailablePrice,
  type HubPackageView,
  type PackageItineraryStep,
  type PackageKey,
  type PackageRoutineStep,
} from '@/lib/sportsevents/hub-packages'

const inputCls =
  'w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50'

type DestinationOption = { id: string; code: string; name: string }

type ConnectPartnerOption = {
  id: string
  name: string
  type: string | null
  stripe_account_id?: string | null
  stripe_connect_status?: string | null
}

type FormState = {
  destination_id: string
  package_key: PackageKey
  name: string
  duration: string
  schedule: string
  concept: string
  featured: boolean
  court_hours: number
  coach_hours: number
  local_match_hours: number
  tournament_hours: number
  nights: number
  itinerary: PackageItineraryStep[]
  price_bb_double: number
  price_bb_single: number
  price_hb_double: number
  price_hb_single: number
  price_full_double: number
  price_full_single: number
  airport_label: string
  local_network: string
  inclusionsText: string
  routine: PackageRoutineStep[]
  published: boolean
  sort_order: number
  hotel_partner_id: string
  transfer_partner_id: string
  split_hotel_percent: number
  split_transfer_percent: number
  en_name: string
  en_duration: string
  en_schedule: string
  en_concept: string
  en_airport_label: string
  en_local_network: string
  en_inclusionsText: string
  en_itinerary: PackageItineraryStep[]
  en_routine: PackageRoutineStep[]
}

const emptyForm = (destinationId = ''): FormState => ({
  destination_id: destinationId,
  package_key: 'weekend',
  name: '',
  duration: '',
  schedule: '',
  concept: '',
  featured: false,
  court_hours: 10,
  coach_hours: 6,
  local_match_hours: 4,
  tournament_hours: 2,
  nights: 3,
  itinerary: [{ day: '', detail: '' }],
  price_bb_double: 0,
  price_bb_single: 0,
  price_hb_double: 0,
  price_hb_single: 0,
  price_full_double: 0,
  price_full_single: 0,
  airport_label: '',
  local_network: '',
  inclusionsText: '',
  routine: [{ title: '', text: '' }],
  published: true,
  sort_order: 0,
  hotel_partner_id: '',
  transfer_partner_id: '',
  split_hotel_percent: 60,
  split_transfer_percent: 10,
  en_name: '',
  en_duration: '',
  en_schedule: '',
  en_concept: '',
  en_airport_label: '',
  en_local_network: '',
  en_inclusionsText: '',
  en_itinerary: [{ day: '', detail: '' }],
  en_routine: [{ title: '', text: '' }],
})

function viewToForm(pkg: HubPackageView): FormState {
  const en = pkg.translations?.en
  return {
    destination_id: pkg.destinationId,
    package_key: pkg.packageKey,
    name: pkg.name,
    duration: pkg.duration,
    schedule: pkg.schedule,
    concept: pkg.concept,
    featured: pkg.featured,
    court_hours: pkg.courtHours,
    coach_hours: pkg.coachHours,
    local_match_hours: pkg.localMatchHours,
    tournament_hours: pkg.tournamentHours,
    nights: pkg.nights,
    itinerary: pkg.itinerary.length
      ? pkg.itinerary
      : [{ day: '', detail: '' }],
    price_bb_double: pkg.prices.bbDouble,
    price_bb_single: pkg.prices.bbSingle,
    price_hb_double: pkg.prices.hbDouble,
    price_hb_single: pkg.prices.hbSingle,
    price_full_double: pkg.prices.fullDouble,
    price_full_single: pkg.prices.fullSingle,
    airport_label: pkg.airportLabel,
    local_network: pkg.localNetwork,
    inclusionsText: pkg.inclusions.join('\n'),
    routine: pkg.routine.length ? pkg.routine : [{ title: '', text: '' }],
    published: pkg.published,
    sort_order: pkg.sortOrder,
    hotel_partner_id: pkg.hotelPartnerId || '',
    transfer_partner_id: pkg.transferPartnerId || '',
    split_hotel_percent: pkg.splitHotelPercent ?? 0,
    split_transfer_percent: pkg.splitTransferPercent ?? 0,
    en_name: en?.name || '',
    en_duration: en?.duration || '',
    en_schedule: en?.schedule || '',
    en_concept: en?.concept || '',
    en_airport_label: en?.airport_label || '',
    en_local_network: en?.local_network || '',
    en_inclusionsText: (en?.inclusions || []).join('\n'),
    en_itinerary: en?.itinerary?.length
      ? en.itinerary
      : [{ day: '', detail: '' }],
    en_routine: en?.routine?.length
      ? en.routine
      : [{ title: '', text: '' }],
  }
}

export function HubPackagesPanel() {
  const [packages, setPackages] = useState<HubPackageView[]>([])
  const [destinations, setDestinations] = useState<DestinationOption[]>([])
  const [connectPartners, setConnectPartners] = useState<
    ConnectPartnerOption[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [hubFilter, setHubFilter] = useState<string>('ALL')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/se/packages')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao carregar pacotes')
        setLoading(false)
        return
      }
      setPackages(data.packages || [])
      setDestinations(data.destinations || [])
      setConnectPartners(data.connectPartners || [])
    } catch {
      setError('Erro de rede ao carregar pacotes.')
    }
    setLoading(false)
  }, [])

  const hotelPartners = useMemo(
    () => connectPartners.filter((p) => p.type === 'HOTEL'),
    [connectPartners]
  )
  const transferPartners = useMemo(
    () => connectPartners.filter((p) => p.type === 'TRANSPORTES'),
    [connectPartners]
  )

  const platformPercent = Math.max(
    0,
    100 - Number(form.split_hotel_percent || 0) - Number(form.split_transfer_percent || 0)
  )

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    if (hubFilter === 'ALL') return packages
    return packages.filter((p) => p.destinationCode === hubFilter)
  }, [packages, hubFilter])

  function startCreate() {
    setEditingId(null)
    setForm(emptyForm(destinations[0]?.id || ''))
    setOkMsg(null)
    setError(null)
  }

  function startEdit(pkg: HubPackageView) {
    setEditingId(pkg.id)
    setForm(viewToForm(pkg))
    setOkMsg(null)
    setError(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setOkMsg(null)

    const payload = {
      ...form,
      hotel_partner_id: form.hotel_partner_id || null,
      transfer_partner_id: form.transfer_partner_id || null,
      inclusions: form.inclusionsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      itinerary: form.itinerary.filter((s) => s.day.trim() || s.detail.trim()),
      routine: form.routine.filter((s) => s.title.trim() || s.text.trim()),
      translations: {
        en: {
          name: form.en_name.trim(),
          duration: form.en_duration.trim(),
          schedule: form.en_schedule.trim(),
          concept: form.en_concept.trim(),
          airport_label: form.en_airport_label.trim(),
          local_network: form.en_local_network.trim(),
          inclusions: form.en_inclusionsText
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean),
          itinerary: form.en_itinerary.filter(
            (s) => s.day.trim() || s.detail.trim()
          ),
          routine: form.en_routine.filter(
            (s) => s.title.trim() || s.text.trim()
          ),
        },
      },
    }

    try {
      const res = await fetch(
        editingId ? `/api/se/packages/${editingId}` : '/api/se/packages',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao guardar')
        setSaving(false)
        return
      }
      setOkMsg(editingId ? 'Pacote atualizado.' : 'Pacote criado.')
      await load()
      if (data.package) {
        setEditingId(data.package.id)
        setForm(viewToForm(data.package))
      }
    } catch {
      setError('Erro de rede ao guardar.')
    }
    setSaving(false)
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`Apagar o pacote “${name}”?`)) return
    const res = await fetch(`/api/se/packages/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Erro ao apagar')
      return
    }
    if (editingId === id) startCreate()
    setOkMsg('Pacote apagado.')
    await load()
  }

  return (
    <div className="space-y-4">
        <div className="rounded-xl border border-cyan/20 bg-cyan/5 px-4 py-3 text-[11px] text-slate-300 leading-relaxed">
          Estes pacotes alimentam o site e o construtor (sem datas). Para abrir
          vendas com datas concretas: sub-aba{' '}
          <strong className="text-white">Edições datadas</strong> →{' '}
          <strong className="text-white">Novo Evento</strong> →{' '}
          <strong className="text-white">Importar pacote</strong>.
        </div>
        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        {okMsg ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {okMsg}
          </div>
        ) : null}

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <aside className="space-y-3">
            <button
              type="button"
              onClick={startCreate}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan/15 border border-cyan/30 text-cyan px-3 py-2.5 text-xs font-bold hover:bg-cyan/25 transition"
            >
              <Plus className="w-4 h-4" /> Novo pacote
            </button>

            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'ALG', 'BCN', 'MAR'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setHubFilter(code)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                    hubFilter === code
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {code === 'ALL' ? 'Todos' : code}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="text-xs text-slate-500">A carregar…</p>
            ) : (
              <ul className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {filtered.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className={`w-full text-left rounded-xl border px-3 py-2.5 transition ${
                        editingId === p.id
                          ? 'border-cyan/50 bg-cyan/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white truncate">
                          {p.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            p.published
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {p.published ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {p.destinationCode} ·{' '}
                        {lowestAvailablePrice(p.prices) != null
                          ? `desde ${formatEuro(lowestAvailablePrice(p.prices)!)}`
                          : 'sem preço público'}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 md:p-6">
            <h2 className="text-sm font-bold text-white mb-5">
              {editingId ? 'Editar pacote' : 'Criar pacote'}
            </h2>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Destino / Hub
                  </span>
                  <select
                    className={inputCls}
                    value={form.destination_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, destination_id: e.target.value }))
                    }
                    required
                  >
                    <option value="">Selecionar…</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Tipo
                  </span>
                  <select
                    className={inputCls}
                    value={form.package_key}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        package_key: e.target.value as PackageKey,
                      }))
                    }
                  >
                    <option value="weekend">Weekend</option>
                    <option value="experience">Experience</option>
                    <option value="premium">Premium</option>
                  </select>
                </label>
                <label className="block space-y-1 sm:col-span-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Nome
                  </span>
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Duração
                  </span>
                  <input
                    className={inputCls}
                    value={form.duration}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, duration: e.target.value }))
                    }
                    placeholder="3 Noites / 4 Dias"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Calendário
                  </span>
                  <input
                    className={inputCls}
                    value={form.schedule}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, schedule: e.target.value }))
                    }
                    placeholder="Quinta a Domingo"
                  />
                </label>
                <label className="block space-y-1 sm:col-span-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Conceito (PT)
                  </span>
                  <textarea
                    className={`${inputCls} min-h-[72px]`}
                    value={form.concept}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, concept: e.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="space-y-3 rounded-xl border border-cyan/20 bg-cyan/5 p-4">
                <p className="text-[10px] uppercase tracking-wider text-cyan font-bold">
                  Tradução EN (site principal /)
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block space-y-1 sm:col-span-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Name (EN)
                    </span>
                    <input
                      className={inputCls}
                      value={form.en_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, en_name: e.target.value }))
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Duration (EN)
                    </span>
                    <input
                      className={inputCls}
                      value={form.en_duration}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, en_duration: e.target.value }))
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Schedule (EN)
                    </span>
                    <input
                      className={inputCls}
                      value={form.en_schedule}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, en_schedule: e.target.value }))
                      }
                    />
                  </label>
                  <label className="block space-y-1 sm:col-span-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Concept (EN)
                    </span>
                    <textarea
                      className={`${inputCls} min-h-[72px]`}
                      value={form.en_concept}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, en_concept: e.target.value }))
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Airport (EN)
                    </span>
                    <input
                      className={inputCls}
                      value={form.en_airport_label}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          en_airport_label: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Local network (EN)
                    </span>
                    <input
                      className={inputCls}
                      value={form.en_local_network}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          en_local_network: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="block space-y-1 sm:col-span-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Inclusions EN (one per line)
                    </span>
                    <textarea
                      className={`${inputCls} min-h-[80px]`}
                      value={form.en_inclusionsText}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          en_inclusionsText: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(
                  [
                    ['nights', 'Noites'],
                    ['court_hours', 'Horas campo'],
                    ['coach_hours', 'Horas treino'],
                    ['local_match_hours', 'Horas vs locais'],
                    ['tournament_hours', 'Horas torneio'],
                    ['sort_order', 'Ordem'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      {label}
                    </span>
                    <input
                      type="number"
                      className={inputCls}
                      value={form[key]}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          [key]: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Preços (€ / pessoa) — 0 = indisponível no site
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(
                    [
                      ['price_bb_double', 'BB Duplo'],
                      ['price_bb_single', 'BB Single'],
                      ['price_hb_double', 'Meia pensão Duplo'],
                      ['price_hb_single', 'Meia pensão Single'],
                      ['price_full_double', 'PC Duplo'],
                      ['price_full_single', 'PC Single'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="block space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        {label}
                      </span>
                      <input
                        type="number"
                        min={0}
                        className={inputCls}
                        value={form[key]}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            [key]: Number(e.target.value) || 0,
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-violet-500/25 bg-violet-500/5 p-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-violet-300 font-bold">
                    Stripe Connect — split automático
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    No checkout, o total do pacote divide-se por estas %: hotel e
                    transfer vão para as contas Connect; o resto fica na
                    plataforma (padel + taxas Stripe).
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Hotel (parceiro)
                    </span>
                    <select
                      className={inputCls}
                      value={form.hotel_partner_id}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          hotel_partner_id: e.target.value,
                        }))
                      }
                    >
                      <option value="">— Selecionar hotel —</option>
                      {hotelPartners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.stripe_connect_status === 'active'
                            ? ' · Connect OK'
                            : ' · Connect pendente'}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Transfers (parceiro)
                    </span>
                    <select
                      className={inputCls}
                      value={form.transfer_partner_id}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          transfer_partner_id: e.target.value,
                        }))
                      }
                    >
                      <option value="">— Sem transfers / opcional —</option>
                      {transferPartners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.stripe_connect_status === 'active'
                            ? ' · Connect OK'
                            : ' · Connect pendente'}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      % Hotel
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      className={inputCls}
                      value={form.split_hotel_percent}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          split_hotel_percent: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      % Transfers
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      className={inputCls}
                      value={form.split_transfer_percent}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          split_transfer_percent: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-300">
                  Plataforma (padel):{' '}
                  <strong className="text-emerald-400">{platformPercent}%</strong>
                  {' · '}
                  Hotel: {form.split_hotel_percent}% · Transfer:{' '}
                  {form.split_transfer_percent}%
                </p>
                {hotelPartners.length === 0 && (
                  <p className="text-[11px] text-amber-400">
                    Ainda não há parceiros tipo HOTEL. Cria-os em Parceiros e
                    completa o onboarding Stripe Connect.
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Aeroporto / transfers
                  </span>
                  <input
                    className={inputCls}
                    value={form.airport_label}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, airport_label: e.target.value }))
                    }
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Network local
                  </span>
                  <input
                    className={inputCls}
                    value={form.local_network}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, local_network: e.target.value }))
                    }
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Inclusões (uma por linha)
                </span>
                <textarea
                  className={`${inputCls} min-h-[90px]`}
                  value={form.inclusionsText}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, inclusionsText: e.target.value }))
                  }
                />
              </label>

              <div className="space-y-2 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Rotina diária
                  </h3>
                  <button
                    type="button"
                    className="text-[11px] text-cyan"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        routine: [...f.routine, { title: '', text: '' }],
                      }))
                    }
                  >
                    + Linha
                  </button>
                </div>
                {form.routine.map((step, i) => (
                  <div key={i} className="grid sm:grid-cols-[1fr_2fr_auto] gap-2">
                    <input
                      className={inputCls}
                      placeholder="Título"
                      value={step.title}
                      onChange={(e) => {
                        const routine = [...form.routine]
                        routine[i] = { ...routine[i], title: e.target.value }
                        setForm((f) => ({ ...f, routine }))
                      }}
                    />
                    <input
                      className={inputCls}
                      placeholder="Texto"
                      value={step.text}
                      onChange={(e) => {
                        const routine = [...form.routine]
                        routine[i] = { ...routine[i], text: e.target.value }
                        setForm((f) => ({ ...f, routine }))
                      }}
                    />
                    <button
                      type="button"
                      className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-red-500/30 text-red-300"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          routine: f.routine.filter((_, j) => j !== i),
                        }))
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Itinerário
                  </h3>
                  <button
                    type="button"
                    className="text-[11px] text-cyan"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        itinerary: [...f.itinerary, { day: '', detail: '' }],
                      }))
                    }
                  >
                    + Dia
                  </button>
                </div>
                {form.itinerary.map((step, i) => (
                  <div key={i} className="grid sm:grid-cols-[1fr_2fr_auto] gap-2">
                    <input
                      className={inputCls}
                      placeholder="Dia"
                      value={step.day}
                      onChange={(e) => {
                        const itinerary = [...form.itinerary]
                        itinerary[i] = { ...itinerary[i], day: e.target.value }
                        setForm((f) => ({ ...f, itinerary }))
                      }}
                    />
                    <input
                      className={inputCls}
                      placeholder="Detalhe"
                      value={step.detail}
                      onChange={(e) => {
                        const itinerary = [...form.itinerary]
                        itinerary[i] = {
                          ...itinerary[i],
                          detail: e.target.value,
                        }
                        setForm((f) => ({ ...f, itinerary }))
                      }}
                    />
                    <button
                      type="button"
                      className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-red-500/30 text-red-300"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          itinerary: f.itinerary.filter((_, j) => j !== i),
                        }))
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, featured: e.target.checked }))
                    }
                  />
                  Produto estrela
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, published: e.target.checked }))
                    }
                  />
                  Publicado no site
                </label>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-xs font-bold text-navy hover:brightness-110 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'A guardar…' : 'Guardar'}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={() => onDelete(editingId, form.name || 'pacote')}
                    className="inline-flex items-center gap-2 rounded-full border border-red-500/40 px-4 py-2.5 text-xs font-semibold text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Apagar
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        </div>
    </div>
  )
}
