'use client'

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  IdCard,
  Plus,
  QrCode,
  Save,
  Trash2,
  Upload,
} from 'lucide-react'
import {
  normalizeSlug,
  type CardBrochure,
  type DigitalCardRow,
} from '@/lib/sportsevents/cards'
import { ImageUploadField } from '@/components/sportsevents/ImageUploadField'

const inputCls =
  'w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50'

const emptyForm = {
  slug: '',
  full_name: '',
  title: '',
  hub: '',
  email: '',
  phone: '',
  phone_display: '',
  address_line: '',
  city: '',
  postal_code: '',
  country: '',
  photo_url: '',
  active: true,
  sort_order: 0,
  brochures: [] as CardBrochure[],
}

type FormState = typeof emptyForm

function rowToForm(row: DigitalCardRow): FormState {
  return {
    slug: row.slug,
    full_name: row.full_name,
    title: row.title || '',
    hub: row.hub || '',
    email: row.email || '',
    phone: row.phone || '',
    phone_display: row.phone_display || '',
    address_line: row.address_line || '',
    city: row.city || '',
    postal_code: row.postal_code || '',
    country: row.country || '',
    photo_url: row.photo_url || '',
    active: row.active,
    sort_order: row.sort_order ?? 0,
    brochures: Array.isArray(row.brochures) ? row.brochures : [],
  }
}

export function CartoesPanel() {
  const [cards, setCards] = useState<DigitalCardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrSlug, setQrSlug] = useState<string | null>(null)
  const [uploadingBrochureIndex, setUploadingBrochureIndex] = useState<
    number | null
  >(null)

  const siteUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return (process.env.NEXT_PUBLIC_SPORTSEVENTS_SITE_URL || 'https://sportsevents.app')
    }
    return 'https://sportsevents.app'
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/se/cards')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao carregar cartões')
        setLoading(false)
        return
      }
      setCards(data.cards || [])
    } catch {
      setError('Erro de rede ao carregar cartões.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function startCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setOkMsg(null)
    setError(null)
    setQrDataUrl(null)
    setQrSlug(null)
  }

  function startEdit(row: DigitalCardRow) {
    setEditingId(row.id)
    setForm(rowToForm(row))
    setOkMsg(null)
    setError(null)
    setQrDataUrl(null)
    setQrSlug(null)
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'full_name' && !editingId && !prev.slug) {
        next.slug = normalizeSlug(String(value))
      }
      return next
    })
  }

  function updateBrochure(index: number, key: keyof CardBrochure, value: string) {
    setForm((prev) => {
      const brochures = [...prev.brochures]
      brochures[index] = { ...brochures[index], [key]: value }
      return { ...prev, brochures }
    })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setOkMsg(null)

    const payload = {
      ...form,
      slug: normalizeSlug(form.slug),
      sort_order: Number(form.sort_order) || 0,
    }

    try {
      const res = await fetch(
        editingId ? `/api/se/cards/${editingId}` : '/api/se/cards',
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
      setOkMsg(editingId ? 'Cartão atualizado.' : 'Cartão criado.')
      await load()
      if (data.card) {
        setEditingId(data.card.id)
        setForm(rowToForm(data.card))
      }
    } catch {
      setError('Erro de rede ao guardar.')
    }
    setSaving(false)
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`Apagar o cartão de ${name}? Esta ação não se desfaz.`)) return
    setError(null)
    const res = await fetch(`/api/se/cards/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Erro ao apagar')
      return
    }
    if (editingId === id) startCreate()
    setOkMsg('Cartão apagado.')
    await load()
  }

  async function generateQr(slug: string) {
    const url = `${siteUrl}/${slug}`
    const dataUrl = await QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: '#0B1C2C', light: '#FFFFFF' },
    })
    setQrDataUrl(dataUrl)
    setQrSlug(slug)
  }

  function downloadQr() {
    if (!qrDataUrl || !qrSlug) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `qr-${qrSlug}.png`
    a.click()
  }

  async function copyUrl(slug: string) {
    const url = `${siteUrl}/${slug}`
    await navigator.clipboard.writeText(url)
    setOkMsg(`URL copiada: ${url}`)
  }

  async function uploadAsset(
    file: File,
    kind: 'photo' | 'brochure'
  ): Promise<{ url: string; fileName: string } | null> {
    const body = new FormData()
    body.append('file', file)
    body.append('kind', kind)
    body.append('slug', normalizeSlug(form.slug) || 'draft')

    const res = await fetch('/api/se/cards/upload', {
      method: 'POST',
      body,
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Erro no upload')
      return null
    }
    return { url: data.url as string, fileName: data.fileName as string }
  }

  async function onBrochurePdfSelected(index: number, file: File | null) {
    if (!file) return
    setError(null)
    setUploadingBrochureIndex(index)
    const result = await uploadAsset(file, 'brochure')
    setUploadingBrochureIndex(null)
    if (!result) return
    setForm((prev) => {
      const brochures = [...prev.brochures]
      const current = brochures[index]
      const labelFromFile = result.fileName.replace(/\.pdf$/i, '')
      brochures[index] = {
        ...current,
        href: result.url,
        label: current.label.trim() || labelFromFile,
      }
      return { ...prev, brochures }
    })
    setOkMsg('PDF carregado. Não te esqueças de Guardar o cartão.')
  }

  return (
    <div className="min-h-screen bg-navy text-app-white font-sans flex flex-col">
      <header className="bg-navy/90 border-b border-white/10 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
                    <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2 font-[family-name:var(--font-display)]">
              <IdCard className="w-5 h-5 text-cyan" />
              Cartões digitais
            </h1>
            <p className="text-xs text-app-white/55">
              Editar páginas · QR Code · Transferir Contacto (.vcf)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/produtos/sportsevents"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> ERP
          </Link>
          
        </div>
      </header>

      <main className="p-6 flex-1 max-w-6xl mx-auto w-full space-y-6">
        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        {okMsg ? (
          <div className="rounded-xl border border-emerald-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-emerald-200 flex items-center gap-2">
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
              <Plus className="w-4 h-4" /> Novo cartão
            </button>

            {loading ? (
              <p className="text-xs text-slate-500 px-1">A carregar…</p>
            ) : (
              <ul className="space-y-2">
                {cards.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className={`w-full text-left rounded-xl border px-3 py-2.5 transition ${
                        editingId === c.id
                          ? 'border-cyan/50 bg-cyan/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white truncate">
                          {c.full_name}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            c.active
                              ? 'bg-cyan-500/15 text-emerald-300'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {c.active ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        /{c.slug}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h2 className="text-sm font-bold text-white">
                {editingId ? 'Editar cartão' : 'Criar cartão'}
              </h2>
              {form.slug ? (
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/${form.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-300 hover:border-cyan/40 hover:text-cyan"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Ver página
                  </a>
                  <button
                    type="button"
                    onClick={() => copyUrl(normalizeSlug(form.slug))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-300 hover:border-cyan/40"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar URL
                  </button>
                  <button
                    type="button"
                    onClick={() => generateQr(normalizeSlug(form.slug))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-200 hover:bg-amber-500/20"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Gerar QR
                  </button>
                </div>
              ) : null}
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Nome completo
                  </span>
                  <input
                    className={inputCls}
                    value={form.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                    required
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Slug (URL)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 shrink-0">
                      /{' '}
                    </span>
                    <input
                      className={inputCls}
                      value={form.slug}
                      onChange={(e) =>
                        updateField('slug', normalizeSlug(e.target.value))
                      }
                      required
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    />
                  </div>
                </label>
                <label className="block space-y-1 sm:col-span-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Cargo / título
                  </span>
                  <input
                    className={inputCls}
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Hub / região
                  </span>
                  <input
                    className={inputCls}
                    value={form.hub}
                    onChange={(e) => updateField('hub', e.target.value)}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Ordem
                  </span>
                  <input
                    type="number"
                    className={inputCls}
                    value={form.sort_order}
                    onChange={(e) =>
                      updateField('sort_order', Number(e.target.value) || 0)
                    }
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Email
                  </span>
                  <input
                    type="email"
                    className={inputCls}
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Telefone (E.164)
                  </span>
                  <input
                    className={inputCls}
                    placeholder="+351969365059"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Telefone (mostrar)
                  </span>
                  <input
                    className={inputCls}
                    placeholder="+351 969 365 059"
                    value={form.phone_display}
                    onChange={(e) =>
                      updateField('phone_display', e.target.value)
                    }
                  />
                </label>
                <div className="sm:col-span-2">
                  <ImageUploadField
                    label="Foto"
                    value={form.photo_url}
                    onChange={(url) => {
                      updateField('photo_url', url)
                      if (url)
                        setOkMsg(
                          'Foto carregada. Não te esqueças de Guardar o cartão.'
                        )
                    }}
                    kind="cards"
                    slug={normalizeSlug(form.slug) || 'draft'}
                    uploadUrl="/api/se/cards/upload"
                    extraFormFields={{ kind: 'photo' }}
                    previewAspect="square"
                    allowUrlFallback
                  />
                </div>
                <label className="block space-y-1 sm:col-span-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Morada
                  </span>
                  <input
                    className={inputCls}
                    value={form.address_line}
                    onChange={(e) =>
                      updateField('address_line', e.target.value)
                    }
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Código postal
                  </span>
                  <input
                    className={inputCls}
                    value={form.postal_code}
                    onChange={(e) =>
                      updateField('postal_code', e.target.value)
                    }
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Cidade
                  </span>
                  <input
                    className={inputCls}
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    País
                  </span>
                  <input
                    className={inputCls}
                    value={form.country}
                    onChange={(e) => updateField('country', e.target.value)}
                  />
                </label>
                <label className="flex items-center gap-2 pt-5 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => updateField('active', e.target.checked)}
                    className="rounded border-slate-600"
                  />
                  Página pública ativa
                </label>
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Brochuras B2B
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        brochures: [
                          ...prev.brochures,
                          { label: '', href: '', blurb: '' },
                        ],
                      }))
                    }
                    className="text-[11px] text-cyan hover:underline"
                  >
                    + Adicionar link
                  </button>
                </div>
                {form.brochures.length === 0 ? (
                  <p className="text-[11px] text-slate-500">
                    Sem brochuras. Adiciona um PDF ou um link para uma página.
                  </p>
                ) : (
                  form.brochures.map((b, i) => (
                    <div
                      key={i}
                      className="space-y-2 rounded-xl border border-slate-800 p-3"
                    >
                      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                        <label className="block space-y-1">
                          <span className="text-[10px] text-slate-500">
                            Label
                          </span>
                          <input
                            className={inputCls}
                            value={b.label}
                            onChange={(e) =>
                              updateBrochure(i, 'label', e.target.value)
                            }
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-[10px] text-slate-500">
                            Descrição
                          </span>
                          <input
                            className={inputCls}
                            value={b.blurb}
                            onChange={(e) =>
                              updateBrochure(i, 'blurb', e.target.value)
                            }
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              brochures: prev.brochures.filter(
                                (_, j) => j !== i
                              ),
                            }))
                          }
                          className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10"
                          aria-label="Remover brochura"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-end gap-2">
                        <label className="flex-1 min-w-[180px] block space-y-1">
                          <span className="text-[10px] text-slate-500">
                            URL (PDF ou página)
                          </span>
                          <input
                            className={inputCls}
                            value={b.href}
                            onChange={(e) =>
                              updateBrochure(i, 'href', e.target.value)
                            }
                          />
                        </label>
                        <label className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] font-bold text-amber-200 cursor-pointer hover:bg-amber-500/20">
                          <Upload className="w-3.5 h-3.5" />
                          {uploadingBrochureIndex === i
                            ? 'A carregar…'
                            : 'Upload PDF'}
                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            className="hidden"
                            disabled={uploadingBrochureIndex === i}
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null
                              e.target.value = ''
                              void onBrochurePdfSelected(i, f)
                            }}
                          />
                        </label>
                        {b.href ? (
                          <a
                            href={b.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-2 text-[11px] text-slate-300 hover:border-cyan/40"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Abrir
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
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
                    onClick={() =>
                      onDelete(
                        editingId,
                        form.full_name || 'este cartão'
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-red-500/40 px-4 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Apagar
                  </button>
                ) : null}
              </div>
            </form>

            {qrDataUrl && qrSlug ? (
              <div className="mt-6 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 flex flex-col sm:flex-row items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`QR ${qrSlug}`}
                  className="w-40 h-40 rounded-xl bg-slate-950 p-2"
                />
                <div className="space-y-2 text-center sm:text-left">
                  <p className="text-sm font-bold text-white">
                    QR Code · /{qrSlug}
                  </p>
                  <p className="text-[11px] text-slate-400 break-all">
                    {siteUrl}/{qrSlug}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Descarrega o PNG e coloca no ecrã de bloqueio do telemóvel.
                  </p>
                  <button
                    type="button"
                    onClick={downloadQr}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 text-navy px-3 py-2 text-xs font-bold hover:brightness-110"
                  >
                    <Download className="w-3.5 h-3.5" /> Descarregar PNG
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  )
}
