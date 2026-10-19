'use client'

import { useEffect, useMemo, useState } from 'react'
import { seJson } from '@/lib/sportsevents/se-api'
import { filterHubDestinations, slugify } from '@/lib/sportsevents/hubs'
import { Save, X } from 'lucide-react'
import type { LookupOption } from '@/components/sportsevents/CreateModals'
import { endDateFromNights, packageToEventPrefill, type HubPackageView } from '@/lib/sportsevents/hub-packages'
import { MiniDateRangePicker } from '@/components/sportsevents/MiniDateRangePicker'
import { ImageUploadField } from '@/components/sportsevents/ImageUploadField'

const inputCls =
  'w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50'

export type EventRow = {
  id?: string
  title?: string
  slug?: string | null
  sport_id?: string | null
  destination_id?: string | null
  hub_package_id?: string | null
  start_date?: string
  end_date?: string
  group_size?: number
  max_participants?: number | null
  total_revenue?: number
  total_cost?: number
  sale_price_per_person?: number | null
  deposit_amount?: number | null
  currency?: string | null
  assigned_manager?: string
  status?: string | null
  published?: boolean | null
  short_description?: string | null
  description?: string | null
  courts_padel?: number | null
  courts_football?: number | null
  courts_other?: number | null
  courts_notes?: string | null
  coaches?: string | null
  hotel_name?: string | null
  hotel_details?: string | null
  restaurants?: string | null
  welcome_pack?: string | null
  program?: string | null
  includes?: string | null
  highlights?: string | null
  cover_image_url?: string | null
}

function Field({
  label,
  children,
  className = '',
  hint,
}: {
  label: string
  children: React.ReactNode
  className?: string
  hint?: string
}) {
  return (
    <label className={`space-y-1 block ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {children}
      {hint && <span className="text-[10px] text-slate-600 block">{hint}</span>}
    </label>
  )
}

const emptyForm = (padelId = '', destId = ''): EventRow => ({
  title: '',
  slug: '',
  sport_id: padelId,
  destination_id: destId,
  hub_package_id: null,
  start_date: '',
  end_date: '',
  group_size: 16,
  max_participants: 16,
  total_revenue: 0,
  total_cost: 0,
  sale_price_per_person: 795,
  deposit_amount: 150,
  currency: 'EUR',
  assigned_manager: 'PAI',
  status: 'PLANEAMENTO',
  published: false,
  short_description: '',
  description: '',
  courts_padel: 4,
  courts_football: 0,
  courts_other: 0,
  courts_notes: '',
  coaches: '',
  hotel_name: '',
  hotel_details: '',
  restaurants: '',
  welcome_pack: '',
  program: '',
  includes: '',
  highlights: '',
  cover_image_url: '',
})

export function EventFichaModal({
  destinations,
  sports,
  initial,
  onClose,
  onSaved,
}: {
  destinations: LookupOption[]
  sports: LookupOption[]
  initial?: EventRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const hubs = useMemo(() => filterHubDestinations(destinations), [destinations])
  const padelSport = sports.find((s) => s.name.toLowerCase().includes('padel'))
  const defaultDest = hubs[0]?.id || ''

  const [form, setForm] = useState<EventRow>(
    initial?.id
      ? { ...emptyForm(), ...initial }
      : emptyForm(padelSport?.id || '', defaultDest)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [packages, setPackages] = useState<HubPackageView[]>([])
  const [packagePick, setPackagePick] = useState('')
  const [packageNights, setPackageNights] = useState(0)

  useEffect(() => {
    fetch('/api/se/packages')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.packages)) setPackages(data.packages)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!initial?.id) {
      setForm((f) => ({
        ...f,
        sport_id: f.sport_id || padelSport?.id || '',
        destination_id: f.destination_id || defaultDest,
      }))
    } else if (initial.hub_package_id) {
      setPackagePick(initial.hub_package_id)
    }
  }, [initial?.id, initial?.hub_package_id, padelSport?.id, defaultDest])

  const packagesForHub = useMemo(() => {
    if (!form.destination_id) return packages
    return packages.filter((p) => p.destinationId === form.destination_id)
  }, [packages, form.destination_id])

  function applyPackage(pkgId: string) {
    const pkg = packages.find((p) => p.id === pkgId)
    if (!pkg) return
    const prefill = packageToEventPrefill(pkg)
    setPackageNights(prefill.nights)
    setForm((prev) => {
      const next: EventRow = {
        ...prev,
        hub_package_id: prefill.hub_package_id,
        title: prefill.title,
        destination_id: prefill.destination_id,
        short_description: prefill.short_description,
        description: prefill.description,
        program: prefill.program,
        includes: prefill.includes,
        highlights: prefill.highlights,
        welcome_pack: prefill.welcome_pack,
        sale_price_per_person: prefill.sale_price_per_person,
        deposit_amount: prefill.deposit_amount,
        slug: !prev.id
          ? slugify(`${prefill.title}-${prev.start_date || 'edicao'}`)
          : prev.slug,
      }
      if (prev.start_date && prefill.nights) {
        next.end_date = endDateFromNights(prev.start_date, prefill.nights)
      }
      const pax = Number(next.max_participants || next.group_size || 0)
      next.total_revenue = pax * Number(next.sale_price_per_person || 0)
      return next
    })
    setPackagePick(pkgId)
  }

  function set<K extends keyof EventRow>(key: K, value: EventRow[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'title' && !initial?.id) {
        next.slug = slugify(String(value || ''))
      }
      if (key === 'start_date' && packageNights > 0) {
        next.end_date = endDateFromNights(String(value || ''), packageNights)
      }
      if (key === 'sale_price_per_person' || key === 'group_size' || key === 'max_participants') {
        const pax = Number(next.max_participants || next.group_size || 0)
        const price = Number(next.sale_price_per_person || 0)
        next.total_revenue = pax * price
      }
      return next
    })
  }

  async function handleSave() {
    setError(null)
    if (!form.title?.trim() || !form.start_date || !form.end_date) {
      setError('Título, data de início e data de fim são obrigatórios.')
      return
    }
    if (!form.destination_id) {
      setError('Seleciona um hub: Algarve, Marbella ou Barcelona.')
      return
    }
    if (!form.sale_price_per_person || Number(form.sale_price_per_person) <= 0) {
      setError('Define o preço de venda por pessoa.')
      return
    }

    const slug =
      form.slug?.trim() ||
      `${slugify(form.title)}-${form.start_date}`.replace(/-+/g, '-')

    const payload = {
      title: form.title.trim(),
      slug,
      sport_id: form.sport_id || null,
      destination_id: form.destination_id,
      hub_package_id: form.hub_package_id || null,
      start_date: form.start_date,
      end_date: form.end_date,
      group_size: Number(form.group_size) || 1,
      max_participants: Number(form.max_participants || form.group_size) || 1,
      total_revenue: Number(form.total_revenue) || 0,
      total_cost: Number(form.total_cost) || 0,
      sale_price_per_person: Number(form.sale_price_per_person) || 0,
      deposit_amount: Number(form.deposit_amount) || 0,
      currency: form.currency || 'EUR',
      assigned_manager: form.assigned_manager || 'PAI',
      status: form.status || 'PLANEAMENTO',
      published: Boolean(form.published),
      short_description: form.short_description || null,
      description: form.description || null,
      courts_padel: Number(form.courts_padel) || 0,
      courts_football: Number(form.courts_football) || 0,
      courts_other: Number(form.courts_other) || 0,
      courts_notes: form.courts_notes || null,
      coaches: form.coaches || null,
      hotel_name: form.hotel_name || null,
      hotel_details: form.hotel_details || null,
      restaurants: form.restaurants || null,
      welcome_pack: form.welcome_pack || null,
      program: form.program || null,
      includes: form.includes || null,
      highlights: form.highlights || null,
      cover_image_url: form.cover_image_url || null,
    }

    setSaving(true)
    const { ok, data } = await seJson('/api/se/events', {
      method: form.id ? 'PUT' : 'POST',
      body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload),
    })
    setSaving(false)

    if (!ok) {
      setError(data.error || 'Erro ao guardar ficha')
      return
    }
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 bg-slate-900">
          <div>
            <h3 className="text-sm font-black text-white">
              {form.id ? 'Editar ficha de evento' : 'Nova ficha de evento'}
            </h3>
            <p className="text-[11px] text-slate-500">
              Hub comercial · programa · preço · publicação no site · Stripe
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <section className="rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-3">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gold">
                Importar pacote do catálogo
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Preenche programa, includes, preços e hub. Depois só defines as
                datas desta edição (a data de fim calcula-se pelas noites do
                pacote).
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
              <Field label="Pacote">
                <select
                  className={inputCls}
                  value={packagePick}
                  onChange={(e) => {
                    const id = e.target.value
                    setPackagePick(id)
                    if (id) applyPackage(id)
                  }}
                >
                  <option value="">Sem pacote / manual…</option>
                  {(form.destination_id ? packagesForHub : packages).map(
                    (p) => (
                      <option key={p.id} value={p.id}>
                        {p.destinationCode} · {p.name} (
                        {p.duration || `${p.nights}N`})
                      </option>
                    )
                  )}
                </select>
              </Field>
              {packagePick ? (
                <button
                  type="button"
                  onClick={() => applyPackage(packagePick)}
                  className="h-9 px-3 rounded-xl border border-gold/40 text-[11px] font-bold text-gold hover:bg-gold/10"
                >
                  Reimportar
                </button>
              ) : null}
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              1. Identificação & Hub
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <Field label="Título *" className="sm:col-span-2">
                <input
                  className={inputCls}
                  value={form.title || ''}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Ex.: Padel Camp Algarve — Outubro 2026"
                />
              </Field>
              <Field label="Slug URL (site)" hint="Usado em /eventos/slug">
                <input
                  className={inputCls}
                  value={form.slug || ''}
                  onChange={(e) => set('slug', e.target.value)}
                />
              </Field>
              <Field label="Destino hub *">
                <select
                  className={inputCls}
                  value={form.destination_id || ''}
                  onChange={(e) => set('destination_id', e.target.value)}
                >
                  <option value="">Selecionar hub...</option>
                  {hubs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Modalidade">
                <select
                  className={inputCls}
                  value={form.sport_id || ''}
                  onChange={(e) => set('sport_id', e.target.value)}
                >
                  <option value="">Selecionar...</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Estado operacional">
                <select
                  className={inputCls}
                  value={form.status || 'PLANEAMENTO'}
                  onChange={(e) => set('status', e.target.value)}
                >
                  <option value="PLANEAMENTO">Planeamento</option>
                  <option value="CONFIRMADO">Confirmado</option>
                  <option value="EM_CURSO">Em curso</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </Field>
              <Field label="Gestor">
                <select
                  className={inputCls}
                  value={form.assigned_manager || 'PAI'}
                  onChange={(e) => set('assigned_manager', e.target.value)}
                >
                  <option value="PAI">Operações Algarve (Pai)</option>
                  <option value="FILHO">Comercial / Espanha (Filho)</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Datas do estágio *
                </span>
                <MiniDateRangePicker
                  className="max-w-sm"
                  startDate={form.start_date || ''}
                  endDate={form.end_date || ''}
                  fixedNights={packageNights}
                  onChange={({ startDate, endDate }) => {
                    setForm((prev) => {
                      const next = {
                        ...prev,
                        start_date: startDate,
                        end_date:
                          packageNights > 0 && startDate
                            ? endDateFromNights(startDate, packageNights)
                            : endDate,
                      }
                      return next
                    })
                  }}
                />
              </div>
              <Field label="Resumo curto (site)" className="sm:col-span-2">
                <input
                  className={inputCls}
                  value={form.short_description || ''}
                  onChange={(e) => set('short_description', e.target.value)}
                  placeholder="Uma frase para o card no site"
                />
              </Field>
              <Field label="Descrição comercial" className="sm:col-span-2">
                <textarea
                  className={inputCls}
                  rows={3}
                  value={form.description || ''}
                  onChange={(e) => set('description', e.target.value)}
                />
              </Field>
              <div className="sm:col-span-2">
                <ImageUploadField
                  label="Imagem de capa"
                  value={form.cover_image_url || ''}
                  onChange={(url) => set('cover_image_url', url)}
                  kind="events"
                  slug={form.slug || form.title || 'evento'}
                  allowUrlFallback
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              2. Campos & Capacidade
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <Field label="Campos padel">
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  value={form.courts_padel ?? 0}
                  onChange={(e) => set('courts_padel', Number(e.target.value))}
                />
              </Field>
              <Field label="Campos futebol">
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  value={form.courts_football ?? 0}
                  onChange={(e) => set('courts_football', Number(e.target.value))}
                />
              </Field>
              <Field label="Outros campos">
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  value={form.courts_other ?? 0}
                  onChange={(e) => set('courts_other', Number(e.target.value))}
                />
              </Field>
              <Field label="Máx. participantes">
                <input
                  className={inputCls}
                  type="number"
                  min={1}
                  value={form.max_participants ?? 16}
                  onChange={(e) => set('max_participants', Number(e.target.value))}
                />
              </Field>
              <Field label="Notas campos" className="col-span-2 sm:col-span-4">
                <input
                  className={inputCls}
                  value={form.courts_notes || ''}
                  onChange={(e) => set('courts_notes', e.target.value)}
                  placeholder="Ex.: 4 indoor + 2 outdoor panorâmicos"
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              3. Operações (treinadores, hotel, restaurantes)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <Field label="Treinadores" className="sm:col-span-2">
                <textarea
                  className={inputCls}
                  rows={2}
                  value={form.coaches || ''}
                  onChange={(e) => set('coaches', e.target.value)}
                  placeholder="Ex.: João Silva (Head Coach), Ana Costa — rácio 1:4"
                />
              </Field>
              <Field label="Hotel">
                <input
                  className={inputCls}
                  value={form.hotel_name || ''}
                  onChange={(e) => set('hotel_name', e.target.value)}
                  placeholder="Resort / hotel no Algarve"
                />
              </Field>
              <Field label="Detalhes hotel">
                <input
                  className={inputCls}
                  value={form.hotel_details || ''}
                  onChange={(e) => set('hotel_details', e.target.value)}
                  placeholder="Quarto duplo / BB / transfer incluído"
                />
              </Field>
              <Field label="Restaurantes / pensão" className="sm:col-span-2">
                <textarea
                  className={inputCls}
                  rows={2}
                  value={form.restaurants || ''}
                  onChange={(e) => set('restaurants', e.target.value)}
                />
              </Field>
              <Field label="Welcome pack" className="sm:col-span-2">
                <textarea
                  className={inputCls}
                  rows={2}
                  value={form.welcome_pack || ''}
                  onChange={(e) => set('welcome_pack', e.target.value)}
                  placeholder="T-shirt, garrafa, bola, credencial, mapa..."
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              4. Programa & includes
            </h4>
            <div className="grid grid-cols-1 gap-4 text-xs">
              <Field label="Programa completo">
                <textarea
                  className={inputCls}
                  rows={8}
                  value={form.program || ''}
                  onChange={(e) => set('program', e.target.value)}
                  placeholder={`Dia 1 — Arrival + welcome dinner\nDia 2 — Clinics + matches\n...`}
                />
              </Field>
              <Field label="Inclui">
                <textarea
                  className={inputCls}
                  rows={3}
                  value={form.includes || ''}
                  onChange={(e) => set('includes', e.target.value)}
                />
              </Field>
              <Field label="Destaques">
                <textarea
                  className={inputCls}
                  rows={2}
                  value={form.highlights || ''}
                  onChange={(e) => set('highlights', e.target.value)}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              5. Preço, reserva Stripe & publicação
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <Field label="Preço venda / pessoa (€) *">
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  step={1}
                  value={form.sale_price_per_person ?? 0}
                  onChange={(e) =>
                    set('sale_price_per_person', Number(e.target.value))
                  }
                />
              </Field>
              <Field
                label="Reserva / depósito Stripe (€)"
                hint="Cliente pode pagar só a reserva ou o valor completo"
              >
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  step={1}
                  value={form.deposit_amount ?? 0}
                  onChange={(e) => set('deposit_amount', Number(e.target.value))}
                />
              </Field>
              <Field label="Custo interno estimado (€)">
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  value={form.total_cost ?? 0}
                  onChange={(e) => set('total_cost', Number(e.target.value))}
                />
              </Field>
              <Field label="Receita potencial (€)">
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  value={form.total_revenue ?? 0}
                  onChange={(e) => set('total_revenue', Number(e.target.value))}
                />
              </Field>
              <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 flex flex-wrap gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                    Lucro planeado
                  </span>
                  <span
                    className={`text-sm font-black ${
                      Number(form.total_revenue || 0) - Number(form.total_cost || 0) >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {(
                      Number(form.total_revenue || 0) - Number(form.total_cost || 0)
                    ).toLocaleString('pt-PT')}{' '}
                    €
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                    Margem
                  </span>
                  <span className="text-sm font-black text-cyan-300">
                    {Number(form.total_revenue || 0) > 0
                      ? (
                          ((Number(form.total_revenue || 0) -
                            Number(form.total_cost || 0)) /
                            Number(form.total_revenue || 0)) *
                          100
                        ).toLocaleString('pt-PT', { maximumFractionDigits: 0 })
                      : 0}
                    %
                  </span>
                </div>
              </div>
              <Field label="Publicar no site" className="sm:col-span-2">
                <label className="flex items-center gap-3 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.published)}
                    onChange={(e) => set('published', e.target.checked)}
                    className="accent-cyan-400"
                  />
                  <span className="text-slate-200">
                    Visível em /eventos — clientes podem reservar e pagar com Stripe
                  </span>
                </label>
              </Field>
            </div>
          </section>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 px-5 py-4 border-t border-slate-800 bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'A guardar...' : 'Guardar ficha de evento'}
          </button>
        </div>
      </div>
    </div>
  )
}
