'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { seJson } from '@/lib/sportsevents/se-api'
import {
  Building2,
  ChevronDown,
  Languages,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  Sparkles,
  Trophy,
  Users,
  Wand2,
  X,
} from 'lucide-react'
import {
  PARTNER_TYPES,
  partnerTypeShort,
  type PartnerTypeValue,
} from '@/lib/sportsevents/partner-types'

export type PartnerRow = {
  id: string
  name: string
  type?: string | null
  email?: string | null
  phone?: string | null
  contact_name?: string | null
  rating?: number | null
  status?: string | null
  negotiated_rate?: number | null
  notes?: string | null
  country_code?: string | null
  country_name?: string | null
  city?: string | null
  region?: string | null
  address?: string | null
  courts_info?: string | null
  infrastructure?: string | null
  coaches?: string | null
  responsibles?: string | null
  preferred_language?: string | null
  last_contacted_at?: string | null
  emailed_at?: string | null
  phoned_at?: string | null
  interest?: 'INTERESSE' | 'SEM_INTERESSE' | null
  stripe_account_id?: string | null
  stripe_connect_status?:
    | 'not_connected'
    | 'pending_onboarding'
    | 'active'
    | 'restricted'
    | null
  destinations?: { name?: string | null } | null
}

type OutreachScript = {
  id: string
  lang_code: string
  lang_label: string
  subject: string
  body: string
}

type ListMode =
  | 'A_CONTACTAR'
  | 'EMAIL'
  | 'TELEFONE'
  | 'RESPONDIDO'
  | 'INTERESSE'
  | 'SEM_INTERESSE'
  | 'PARCEIRO'
  | 'ALL'

const COUNTRY_META: Record<
  string,
  { flag: string; label: string; order: number; defaultLang: string }
> = {
  IT: { flag: '🇮🇹', label: 'Itália', order: 1, defaultLang: 'it' },
  FR: { flag: '🇫🇷', label: 'França', order: 2, defaultLang: 'fr' },
  GB: { flag: '🇬🇧', label: 'Reino Unido', order: 3, defaultLang: 'en' },
  CH: { flag: '🇨🇭', label: 'Suíça', order: 4, defaultLang: 'de' },
  BE: { flag: '🇧🇪', label: 'Bélgica', order: 5, defaultLang: 'fr' },
  DE: { flag: '🇩🇪', label: 'Alemanha', order: 6, defaultLang: 'de' },
  NL: { flag: '🇳🇱', label: 'Países Baixos', order: 7, defaultLang: 'nl' },
  SE: { flag: '🇸🇪', label: 'Suécia', order: 8, defaultLang: 'sv' },
  DK: { flag: '🇩🇰', label: 'Dinamarca', order: 9, defaultLang: 'da' },
  PT: { flag: '🇵🇹', label: 'Portugal', order: 10, defaultLang: 'pt' },
  ES: { flag: '🇪🇸', label: 'Espanha', order: 11, defaultLang: 'es' },
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  PROSPECAO: {
    label: 'A contactar',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  CONTACTADO: {
    label: 'Contactado',
    className: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
  RESPONDIDO: {
    label: 'Respondido',
    className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  PARCEIRO: {
    label: 'Parceiro',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
}

const INTEREST_META = {
  INTERESSE: {
    label: 'Com interesse',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  SEM_INTERESSE: {
    label: 'Sem interesse',
    className: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
} as const

function formatContactDate(iso?: string | null) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
    })
  } catch {
    return null
  }
}

const LANG_OPTIONS = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'sv', label: 'Svenska' },
  { code: 'da', label: 'Dansk' },
]

function countryKey(p: PartnerRow) {
  return (p.country_code || 'XX').toUpperCase()
}

function partnerLang(p: PartnerRow) {
  return (
    p.preferred_language ||
    COUNTRY_META[countryKey(p)]?.defaultLang ||
    'en'
  ).toLowerCase()
}

export default function PartnersNetwork({
  partners,
  onRefresh,
  onRequestAddPartner,
}: {
  partners: PartnerRow[]
  onRefresh: () => Promise<void> | void
  onRequestAddPartner?: (type?: PartnerTypeValue) => void
}) {

  const [listMode, setListMode] = useState<ListMode>('A_CONTACTAR')
  const [countryFilter, setCountryFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [scripts, setScripts] = useState<OutreachScript[]>([])
  const [scriptLang, setScriptLang] = useState('pt')
  const [scriptDraft, setScriptDraft] = useState({ subject: '', body: '' })
  const [savingScript, setSavingScript] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [scriptMsg, setScriptMsg] = useState<string | null>(null)
  const [editing, setEditing] = useState<PartnerRow | null>(null)
  const [connectBusyId, setConnectBusyId] = useState<string | null>(null)
  const [savingPartner, setSavingPartner] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadScripts = useCallback(async () => {
    const { ok, data } = await seJson<{ scripts?: OutreachScript[] }>(
      '/api/se/outreach-scripts'
    )
    if (ok && data.scripts?.length) {
      setScripts(data.scripts)
    }
  }, [])

  useEffect(() => {
    void loadScripts()
  }, [loadScripts])

  useEffect(() => {
    const s = scripts.find((x) => x.lang_code === scriptLang)
    if (s) setScriptDraft({ subject: s.subject, body: s.body })
  }, [scriptLang, scripts])

  const counts = useMemo(() => {
    let aContactar = 0
    let email = 0
    let telefone = 0
    let respondido = 0
    let interesse = 0
    let semInteresse = 0
    let parceiro = 0

    for (const p of partners) {
      const status = p.status || 'PROSPECAO'
      if (!p.emailed_at && !p.phoned_at && status !== 'PARCEIRO') aContactar += 1
      if (p.emailed_at) email += 1
      if (p.phoned_at) telefone += 1
      if (status === 'RESPONDIDO' || p.interest) respondido += 1
      if (p.interest === 'INTERESSE') interesse += 1
      if (p.interest === 'SEM_INTERESSE') semInteresse += 1
      if (status === 'PARCEIRO') parceiro += 1
    }

    return {
      A_CONTACTAR: aContactar,
      EMAIL: email,
      TELEFONE: telefone,
      RESPONDIDO: respondido,
      INTERESSE: interesse,
      SEM_INTERESSE: semInteresse,
      PARCEIRO: parceiro,
      ALL: partners.length,
    }
  }, [partners])

  const scopedPartners = useMemo(() => {
    let list = partners
    switch (listMode) {
      case 'A_CONTACTAR':
        list = partners.filter(
          (p) =>
            !p.emailed_at &&
            !p.phoned_at &&
            (p.status || 'PROSPECAO') !== 'PARCEIRO'
        )
        break
      case 'EMAIL':
        list = partners.filter((p) => Boolean(p.emailed_at))
        break
      case 'TELEFONE':
        list = partners.filter((p) => Boolean(p.phoned_at))
        break
      case 'RESPONDIDO':
        list = partners.filter(
          (p) => (p.status || '') === 'RESPONDIDO' || Boolean(p.interest)
        )
        break
      case 'INTERESSE':
        list = partners.filter((p) => p.interest === 'INTERESSE')
        break
      case 'SEM_INTERESSE':
        list = partners.filter((p) => p.interest === 'SEM_INTERESSE')
        break
      case 'PARCEIRO':
        list = partners.filter((p) => (p.status || '') === 'PARCEIRO')
        break
      default:
        list = partners
    }
    if (typeFilter !== 'ALL') {
      list = list.filter((p) => (p.type || 'CLUBE_PADEL') === typeFilter)
    }
    return list
  }, [partners, listMode, typeFilter])

  const typeCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of partners) {
      const t = p.type || 'CLUBE_PADEL'
      map.set(t, (map.get(t) || 0) + 1)
    }
    return map
  }, [partners])

  const countries = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of scopedPartners) {
      const code = countryKey(p)
      map.set(code, (map.get(code) || 0) + 1)
    }
    return [...map.entries()]
      .map(([code, count]) => ({
        code,
        count,
        flag: COUNTRY_META[code]?.flag || '🌍',
        label: COUNTRY_META[code]?.label || code,
        order: COUNTRY_META[code]?.order ?? 99,
      }))
      .sort((a, b) => a.order - b.order)
  }, [scopedPartners])

  const grouped = useMemo(() => {
    const filtered =
      countryFilter === 'ALL'
        ? scopedPartners
        : scopedPartners.filter((p) => countryKey(p) === countryFilter)

    const byCountry = new Map<string, PartnerRow[]>()
    for (const p of filtered) {
      const code = countryKey(p)
      const list = byCountry.get(code) || []
      list.push(p)
      byCountry.set(code, list)
    }

    return [...byCountry.entries()]
      .map(([code, items]) => ({
        code,
        flag: COUNTRY_META[code]?.flag || '🌍',
        label: COUNTRY_META[code]?.label || items[0]?.country_name || code,
        order: COUNTRY_META[code]?.order ?? 99,
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.order - b.order)
  }, [scopedPartners, countryFilter])

  function scriptForPartner(p: PartnerRow) {
    const lang = partnerLang(p)
    return (
      scripts.find((s) => s.lang_code === lang) ||
      scripts.find((s) => s.lang_code === 'en') ||
      scripts[0]
    )
  }

  async function saveScript(lang = scriptLang, draft = scriptDraft) {
    setSavingScript(true)
    setScriptMsg(null)
    const { ok, data } = await seJson('/api/se/outreach-scripts', {
      method: 'PUT',
      body: JSON.stringify({
        lang_code: lang,
        lang_label:
          LANG_OPTIONS.find((l) => l.code === lang)?.label || lang,
        subject: draft.subject,
        body: draft.body,
        updated_at: new Date().toISOString(),
      }),
    })
    setSavingScript(false)
    if (!ok) {
      setScriptMsg(`Erro: ${data.error || 'falha'}`)
      return false
    }
    await loadScripts()
    return true
  }

  async function savePortugueseAndTranslate() {
    const pt = scripts.find((s) => s.lang_code === 'pt')
    const source =
      scriptLang === 'pt'
        ? scriptDraft
        : {
            subject: pt?.subject || scriptDraft.subject,
            body: pt?.body || scriptDraft.body,
          }

    // Ensure we're saving the PT draft if currently editing PT
    const ptDraft =
      scriptLang === 'pt'
        ? scriptDraft
        : {
            subject: source.subject,
            body: source.body,
          }

    if (!ptDraft.subject.trim() || !ptDraft.body.trim()) {
      setScriptMsg('Escreve primeiro o script em Português (assunto + corpo).')
      setScriptLang('pt')
      return
    }

    setTranslating(true)
    setScriptMsg(null)

    const saved = await saveScript('pt', ptDraft)
    if (!saved) {
      setTranslating(false)
      return
    }

    try {
      const res = await fetch('/api/se/crm/translate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ptDraft),
      })
      const data = await res.json()
      if (!res.ok) {
        setScriptMsg(data.error || 'Falha na tradução automática.')
        setTranslating(false)
        return
      }

      const translations = (data.translations || []) as Array<{
        lang_code: string
        lang_label: string
        subject: string
        body: string
      }>

      for (const tr of translations) {
        const { ok: upOk, data: upData } = await seJson('/api/se/outreach-scripts', {
          method: 'PUT',
          body: JSON.stringify({
            lang_code: tr.lang_code,
            lang_label: tr.lang_label,
            subject: tr.subject,
            body: tr.body,
            updated_at: new Date().toISOString(),
          }),
        })
        if (!upOk) {
          setScriptMsg(`Traduzido parcialmente. Erro em ${tr.lang_code}: ${upData.error || 'falha'}`)
          setTranslating(false)
          await loadScripts()
          return
        }
      }

      await loadScripts()
      setScriptMsg(
        `Português guardado e traduzido para ${translations.length} idiomas. Podes corrigir qualquer língua nas abas.`
      )
      setScriptLang('pt')
      setScriptDraft(ptDraft)
    } catch (e) {
      setScriptMsg(
        e instanceof Error ? e.message : 'Erro ao traduzir o script.'
      )
    } finally {
      setTranslating(false)
    }
  }

  async function startStripeConnect(partner: PartnerRow) {
    setConnectBusyId(partner.id)
    try {
      const res = await fetch('/api/se/stripe/connect-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
          country: partner.country_code || 'PT',
          email: partner.email || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Erro ao criar onboarding Stripe Connect')
        return
      }
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl as string
        return
      }
      alert('Link de onboarding não devolvido.')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro de rede')
    } finally {
      setConnectBusyId(null)
    }
  }

  async function refreshStripeConnect(partner: PartnerRow) {
    setConnectBusyId(partner.id)
    try {
      const res = await fetch(
        `/api/se/stripe/connect-account?partnerId=${encodeURIComponent(partner.id)}`
      )
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Erro ao sincronizar Connect')
        return
      }
      await onRefresh()
      alert(`Stripe Connect: ${data.status}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro de rede')
    } finally {
      setConnectBusyId(null)
    }
  }

  async function updateStatus(id: string, status: string) {
    const payload: Record<string, unknown> = { status }
    if (status === 'RESPONDIDO' || status === 'PARCEIRO' || status === 'CONTACTADO') {
      payload.last_contacted_at = new Date().toISOString()
    }
    const { ok, data } = await seJson('/api/se/partners', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...payload }),
    })
    if (!ok) {
      alert(data.error || 'Erro ao actualizar')
      return
    }
    await onRefresh()
  }

  async function markChannel(
    partner: PartnerRow,
    channel: 'email' | 'phone',
    clear = false
  ) {
    const now = new Date().toISOString()
    const payload: Record<string, unknown> = {
      last_contacted_at: clear ? partner.last_contacted_at : now,
    }
    if (channel === 'email') {
      payload.emailed_at = clear ? null : now
    } else {
      payload.phoned_at = clear ? null : now
    }
    const status = partner.status || 'PROSPECAO'
    if (
      !clear &&
      (status === 'PROSPECAO' || !status) &&
      status !== 'PARCEIRO' &&
      status !== 'RESPONDIDO'
    ) {
      payload.status = 'CONTACTADO'
    }
    const { ok, data } = await seJson('/api/se/partners', {
      method: 'PATCH',
      body: JSON.stringify({ id: partner.id, ...payload }),
    })
    if (!ok) {
      alert(data.error || 'Erro ao actualizar')
      return
    }
    await onRefresh()
  }

  async function markInterest(
    partner: PartnerRow,
    interest: 'INTERESSE' | 'SEM_INTERESSE' | null
  ) {
    const payload: Record<string, unknown> = {
      interest,
      last_contacted_at: new Date().toISOString(),
    }
    if (interest) {
      payload.status =
        partner.status === 'PARCEIRO' ? 'PARCEIRO' : 'RESPONDIDO'
    }
    const { ok, data } = await seJson('/api/se/partners', {
      method: 'PATCH',
      body: JSON.stringify({ id: partner.id, ...payload }),
    })
    if (!ok) {
      alert(data.error || 'Erro ao actualizar')
      return
    }
    await onRefresh()
  }

  async function savePartner(form: PartnerRow) {
    setSavingPartner(true)
    const { ok, data } = await seJson('/api/se/partners', {
      method: 'PATCH',
      body: JSON.stringify({
        id: form.id,
        name: form.name,
        type: form.type || 'CLUBE_PADEL',
        contact_name: form.contact_name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        region: form.region,
        address: form.address,
        courts_info: form.courts_info,
        infrastructure: form.infrastructure,
        coaches: form.coaches,
        responsibles: form.responsibles,
        preferred_language: form.preferred_language,
        status: form.status || 'PROSPECAO',
        notes: form.notes,
        negotiated_rate: form.negotiated_rate ?? null,
        emailed_at: form.emailed_at || null,
        phoned_at: form.phoned_at || null,
        interest: form.interest || null,
      }),
    })
    setSavingPartner(false)
    if (!ok) {
      alert(data.error || 'Erro ao guardar')
      return
    }
    setEditing(null)
    await onRefresh()
  }

  async function copyScript(p: PartnerRow) {
    const s = scriptForPartner(p)
    if (!s) return
    try {
      await navigator.clipboard.writeText(`${s.subject}\n\n${s.body}`)
      setCopiedId(p.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // ignore
    }
  }

  const modeHelp =
    listMode === 'A_CONTACTAR'
      ? 'Ainda sem contacto marcado (email ou telefone) — próximos a contactar.'
      : listMode === 'EMAIL'
        ? 'Já marcaste envio de email — aguardam follow-up ou resposta.'
        : listMode === 'TELEFONE'
          ? 'Já marcaste contacto por telefone.'
          : listMode === 'RESPONDIDO'
            ? 'Responderam — classifica com interesse ou sem interesse.'
            : listMode === 'INTERESSE'
              ? 'Responderam com interesse — candidatos a parceiro.'
              : listMode === 'SEM_INTERESSE'
                ? 'Responderam sem interesse — arquivados para não voltar a insistir.'
                : listMode === 'PARCEIRO'
                  ? 'Parceiros ativos — clubes, hospitality, sponsors e treinadores.'
                  : 'Vista completa de todas as fichas da rede.'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            Rede de Parceiros (clubes, hotels, sponsors…)
          </h2>
          <p className="text-xs text-slate-400 mt-1">{modeHelp}</p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setAddMenuOpen((o) => !o)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Adicionar parceiro
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {addMenuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10 cursor-default"
                aria-label="Fechar menu"
                onClick={() => setAddMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-700 bg-slate-900 shadow-xl py-1">
                {PARTNER_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setAddMenuOpen(false)
                      onRequestAddPartner?.(t.value)
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-cyan-300"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tipo de parceiro */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          active={typeFilter === 'ALL'}
          onClick={() => setTypeFilter('ALL')}
          label={`Todos (${partners.length})`}
        />
        {PARTNER_TYPES.map((t) => {
          const n = typeCounts.get(t.value) || 0
          return (
            <FilterChip
              key={t.value}
              active={typeFilter === t.value}
              onClick={() => setTypeFilter(t.value)}
              label={`${t.short} (${n})`}
            />
          )
        })}
      </div>

      {/* Pipeline de contacto */}
      <div className="flex flex-wrap gap-2 bg-slate-950 border border-slate-800 p-1 rounded-2xl w-fit max-w-full">
        {(
          [
            ['A_CONTACTAR', `A contactar (${counts.A_CONTACTAR})`, 'amber'],
            ['EMAIL', `Email enviado (${counts.EMAIL})`, 'sky'],
            ['TELEFONE', `Telefone (${counts.TELEFONE})`, 'violet'],
            ['RESPONDIDO', `Respondidos (${counts.RESPONDIDO})`, 'cyan'],
            ['INTERESSE', `Com interesse (${counts.INTERESSE})`, 'emerald'],
            ['SEM_INTERESSE', `Sem interesse (${counts.SEM_INTERESSE})`, 'rose'],
            ['PARCEIRO', `Parceiros (${counts.PARCEIRO})`, 'emerald'],
            ['ALL', `Todos (${counts.ALL})`, 'slate'],
          ] as const
        ).map(([mode, label, tone]) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              setListMode(mode)
              setCountryFilter('ALL')
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              listMode === mode
                ? tone === 'amber'
                  ? 'bg-amber-500 text-slate-950'
                  : tone === 'sky'
                    ? 'bg-sky-500 text-slate-950'
                    : tone === 'violet'
                      ? 'bg-violet-500 text-white'
                      : tone === 'cyan'
                        ? 'bg-cyan-500 text-slate-950'
                        : tone === 'rose'
                          ? 'bg-rose-500 text-white'
                          : tone === 'emerald'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Script editor — PT base + auto-translate */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Script de abordagem
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
              Base: Português
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LANG_OPTIONS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setScriptLang(l.code)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                  scriptLang === l.code
                    ? l.code === 'pt'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : 'border-slate-700 text-slate-500 hover:text-slate-300'
                }`}
              >
                {l.label}
                {l.code === 'pt' ? ' ★' : ''}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
          Escreve em <strong className="text-slate-300">Português</strong> e
          clica em traduzir — EN / FR / IT / DE / NL / SV / DA são gerados
          automaticamente. Depois podes abrir cada idioma e corrigir à mão.
        </p>
        {scriptLang !== 'pt' && (
          <p className="text-[11px] text-cyan-400/90 bg-cyan-500/5 border border-cyan-500/20 rounded-lg px-3 py-2">
            Estás a corrigir a versão{' '}
            <strong>
              {LANG_OPTIONS.find((l) => l.code === scriptLang)?.label}
            </strong>
            . Guarda só este idioma para não sobrescrever as outras traduções.
          </p>
        )}
        <input
          value={scriptDraft.subject}
          onChange={(e) =>
            setScriptDraft((d) => ({ ...d, subject: e.target.value }))
          }
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500/50"
          placeholder={
            scriptLang === 'pt'
              ? 'Assunto do email (em português)'
              : 'Assunto traduzido (podes corrigir)'
          }
        />
        <textarea
          value={scriptDraft.body}
          onChange={(e) =>
            setScriptDraft((d) => ({ ...d, body: e.target.value }))
          }
          rows={7}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-cyan-500/50 resize-y"
          placeholder={
            scriptLang === 'pt'
              ? 'Corpo do script em português...'
              : 'Corpo traduzido (podes corrigir)...'
          }
        />
        <div className="flex flex-wrap items-center gap-2">
          {scriptLang === 'pt' ? (
            <button
              type="button"
              onClick={savePortugueseAndTranslate}
              disabled={translating || savingScript}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {translating
                ? 'A traduzir para todos os idiomas...'
                : 'Guardar PT + Traduzir automaticamente'}
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                const ok = await saveScript()
                if (ok) setScriptMsg(`Correção em ${scriptLang.toUpperCase()} guardada.`)
              }}
              disabled={savingScript || translating}
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl"
            >
              <Save className="w-3.5 h-3.5" />
              {savingScript
                ? 'A guardar...'
                : `Guardar correção (${scriptLang.toUpperCase()})`}
            </button>
          )}
          {scriptLang === 'pt' && (
            <button
              type="button"
              onClick={async () => {
                const ok = await saveScript('pt', scriptDraft)
                if (ok) setScriptMsg('Português guardado (sem retraduzir).')
              }}
              disabled={savingScript || translating}
              className="inline-flex items-center gap-2 bg-slate-950 border border-slate-700 hover:border-slate-500 text-slate-300 font-semibold text-xs px-4 py-2 rounded-xl"
            >
              <Save className="w-3.5 h-3.5" />
              Guardar só PT
            </button>
          )}
          {scriptMsg && (
            <span className="text-[11px] text-emerald-400 max-w-xl">
              {scriptMsg}
            </span>
          )}
        </div>
      </div>

      {/* Country filters */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={countryFilter === 'ALL'}
          onClick={() => setCountryFilter('ALL')}
          label={`Todos (${scopedPartners.length})`}
        />
        {countries.map((c) => (
          <FilterChip
            key={c.code}
            active={countryFilter === c.code}
            onClick={() => setCountryFilter(c.code)}
            label={`${c.flag} ${c.label} (${c.count})`}
          />
        ))}
      </div>

      {grouped.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-8 text-center rounded-2xl text-xs text-slate-500">
          Nenhum parceiro nesta lista. Usa os botões na ficha para marcar contacto
          por email ou telefone, interesse ou sem interesse.
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.code} className="space-y-3">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
                <span className="text-2xl leading-none">{group.flag}</span>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wide">
                    {group.label}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {group.items.length} ficha
                    {group.items.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {group.items.map((p) => {
                  const status = p.status || 'PROSPECAO'
                  const st = STATUS_META[status] || STATUS_META.PROSPECAO
                  const s = scriptForPartner(p)
                  const lang = partnerLang(p)
                  const interestMeta = p.interest
                    ? INTEREST_META[p.interest]
                    : null

                  return (
                    <article
                      key={p.id}
                      className="bg-slate-900 border border-slate-800 p-4 rounded-2xl hover:border-slate-700 transition-all flex flex-col"
                    >
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-cyan-400 uppercase tracking-wider">
                          {partnerTypeShort(p.type)}
                        </span>
                        <select
                          value={status}
                          onChange={(e) => updateStatus(p.id, e.target.value)}
                          className={`text-[10px] font-bold border rounded-full px-2 py-0.5 bg-slate-950 focus:outline-none ${st.className}`}
                        >
                          <option value="PROSPECAO">A contactar</option>
                          <option value="CONTACTADO">Contactado</option>
                          <option value="RESPONDIDO">Respondido</option>
                          <option value="PARCEIRO">Parceiro</option>
                        </select>
                      </div>

                      <h4 className="font-bold text-sm text-white leading-snug">
                        {p.name}
                      </h4>
                      <div className="text-xs text-slate-400 mt-1.5 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                        <span>
                          {[p.city, p.region].filter(Boolean).join(' · ') ||
                            'N/D'}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.emailed_at
                              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                              : 'bg-slate-950 text-slate-600 border-slate-800'
                          }`}
                          title={
                            p.emailed_at
                              ? 'Contacto por email já marcado'
                              : 'Ainda não marcaste envio de email (os dados de contacto podem já existir abaixo)'
                          }
                        >
                          <Mail className="w-3 h-3" />
                          {p.emailed_at
                            ? `Email ✓ ${formatContactDate(p.emailed_at)}`
                            : 'Email por marcar'}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.phoned_at
                              ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                              : 'bg-slate-950 text-slate-600 border-slate-800'
                          }`}
                          title={
                            p.phoned_at
                              ? 'Contacto por telefone já marcado'
                              : 'Ainda não marcaste chamada (o número pode já existir abaixo)'
                          }
                        >
                          <Phone className="w-3 h-3" />
                          {p.phoned_at
                            ? `Tel. ✓ ${formatContactDate(p.phoned_at)}`
                            : 'Tel. por marcar'}
                        </span>
                        {interestMeta && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${interestMeta.className}`}
                          >
                            {interestMeta.label}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Languages className="w-3 h-3" />
                        Script:{' '}
                        <span className="text-cyan-400 font-semibold uppercase">
                          {lang}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            markChannel(p, 'email', Boolean(p.emailed_at))
                          }
                          className={`text-[10px] font-bold rounded-lg border px-2 py-1.5 ${
                            p.emailed_at
                              ? 'border-sky-500/40 text-sky-300 bg-sky-500/10'
                              : 'border-slate-700 text-slate-400 hover:border-sky-500/40 hover:text-sky-300'
                          }`}
                        >
                          {p.emailed_at ? 'Email ✓' : 'Marcar email'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            markChannel(p, 'phone', Boolean(p.phoned_at))
                          }
                          className={`text-[10px] font-bold rounded-lg border px-2 py-1.5 ${
                            p.phoned_at
                              ? 'border-violet-500/40 text-violet-300 bg-violet-500/10'
                              : 'border-slate-700 text-slate-400 hover:border-violet-500/40 hover:text-violet-300'
                          }`}
                        >
                          {p.phoned_at ? 'Tel. ✓' : 'Marcar telefone'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            markInterest(
                              p,
                              p.interest === 'INTERESSE' ? null : 'INTERESSE'
                            )
                          }
                          className={`text-[10px] font-bold rounded-lg border px-2 py-1.5 ${
                            p.interest === 'INTERESSE'
                              ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                              : 'border-slate-700 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-300'
                          }`}
                        >
                          Com interesse
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            markInterest(
                              p,
                              p.interest === 'SEM_INTERESSE'
                                ? null
                                : 'SEM_INTERESSE'
                            )
                          }
                          className={`text-[10px] font-bold rounded-lg border px-2 py-1.5 ${
                            p.interest === 'SEM_INTERESSE'
                              ? 'border-rose-500/40 text-rose-300 bg-rose-500/10'
                              : 'border-slate-700 text-slate-400 hover:border-rose-500/40 hover:text-rose-300'
                          }`}
                        >
                          Sem interesse
                        </button>
                      </div>

                      {(p.coaches || p.responsibles || p.contact_name) && (
                        <div className="mt-3 space-y-1 text-xs text-slate-300">
                          {p.responsibles && (
                            <p className="flex gap-1.5">
                              <Users className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span>
                                <span className="text-slate-500">Responsáveis:</span>{' '}
                                {p.responsibles}
                              </span>
                            </p>
                          )}
                          {p.coaches && (
                            <p className="flex gap-1.5">
                              <Trophy className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                              <span>
                                <span className="text-slate-500">Treinadores:</span>{' '}
                                {p.coaches}
                              </span>
                            </p>
                          )}
                          {!p.responsibles && p.contact_name && (
                            <p className="flex gap-1.5">
                              <Users className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span>{p.contact_name}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {listMode === 'PARCEIRO' && (
                        <div className="mt-3 space-y-2 text-xs">
                          {p.courts_info && (
                            <div className="flex gap-2">
                              <Trophy className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                              <p className="text-slate-300">{p.courts_info}</p>
                            </div>
                          )}
                          {p.infrastructure && (
                            <div className="flex gap-2">
                              <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <p className="text-slate-400">{p.infrastructure}</p>
                            </div>
                          )}
                          {p.address && (
                            <p className="text-[11px] text-slate-500 pl-5">
                              {p.address}
                            </p>
                          )}
                        </div>
                      )}

                      {listMode !== 'PARCEIRO' && p.courts_info && (
                        <p className="mt-2 text-[11px] text-slate-500 line-clamp-2">
                          {p.courts_info}
                        </p>
                      )}

                      <div className="mt-auto pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                        {p.phone && (
                          <a
                            href={`tel:${p.phone.replace(/\s/g, '')}`}
                            className="flex items-center gap-2 text-slate-300 hover:text-cyan-400"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            {p.phone}
                          </a>
                        )}
                        {p.email && s && (
                          <a
                            href={`mailto:${p.email}?subject=${encodeURIComponent(s.subject)}&body=${encodeURIComponent(s.body)}`}
                            className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 break-all"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            {p.email}
                          </a>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditing(p)}
                            className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-400"
                          >
                            <Pencil className="w-3 h-3" /> Editar ficha
                          </button>
                          <button
                            type="button"
                            onClick={() => copyScript(p)}
                            className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-slate-300 hover:border-amber-500/40 hover:text-amber-400"
                          >
                            {copiedId === p.id ? 'Copiado ✓' : `Copiar (${lang})`}
                          </button>
                        </div>

                        {(p.type === 'HOTEL' || p.type === 'TRANSPORTES') && (
                          <div className="pt-1 space-y-1.5">
                            <div className="text-[10px] text-slate-500">
                              Stripe Connect:{' '}
                              <span
                                className={
                                  p.stripe_connect_status === 'active'
                                    ? 'text-emerald-400 font-semibold'
                                    : p.stripe_connect_status === 'restricted'
                                      ? 'text-rose-400 font-semibold'
                                      : 'text-amber-400 font-semibold'
                                }
                              >
                                {p.stripe_connect_status || 'not_connected'}
                              </span>
                              {p.stripe_account_id
                                ? ` · ${p.stripe_account_id}`
                                : ''}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                disabled={connectBusyId === p.id}
                                onClick={() => startStripeConnect(p)}
                                className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-2 text-violet-200 hover:border-violet-400/50 disabled:opacity-50"
                              >
                                {connectBusyId === p.id
                                  ? '...'
                                  : p.stripe_account_id
                                    ? 'Reabrir onboarding'
                                    : 'Ligar Stripe'}
                              </button>
                              <button
                                type="button"
                                disabled={
                                  connectBusyId === p.id || !p.stripe_account_id
                                }
                                onClick={() => refreshStripeConnect(p)}
                                className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 disabled:opacity-40"
                              >
                                Sync estado
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {editing && (
        <PartnerEditModal
          partner={editing}
          saving={savingPartner}
          onClose={() => setEditing(null)}
          onSave={savePartner}
        />
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
        active
          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
      }`}
    >
      {label}
    </button>
  )
}

function PartnerEditModal({
  partner,
  saving,
  onClose,
  onSave,
}: {
  partner: PartnerRow
  saving: boolean
  onClose: () => void
  onSave: (p: PartnerRow) => void
}) {
  const [form, setForm] = useState<PartnerRow>(partner)

  function set<K extends keyof PartnerRow>(key: K, value: PartnerRow[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 bg-slate-900">
          <div>
            <h3 className="text-sm font-black text-white">Editar ficha</h3>
            <p className="text-[11px] text-slate-500">{partner.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <Field label="Tipo">
            <select
              value={form.type || 'CLUBE_PADEL'}
              onChange={(e) => set('type', e.target.value)}
              className={inputCls}
            >
              {PARTNER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nome">
            <input
              value={form.name || ''}
              onChange={(e) => set('name', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Estado">
            <select
              value={form.status || 'PROSPECAO'}
              onChange={(e) => set('status', e.target.value)}
              className={inputCls}
            >
              <option value="PROSPECAO">A contactar</option>
              <option value="CONTACTADO">Contactado</option>
              <option value="RESPONDIDO">Respondido</option>
              <option value="PARCEIRO">Parceiro</option>
            </select>
          </Field>
          <Field label="Resposta / interesse">
            <select
              value={form.interest || ''}
              onChange={(e) =>
                set(
                  'interest',
                  (e.target.value || null) as PartnerRow['interest']
                )
              }
              className={inputCls}
            >
              <option value="">Ainda sem resposta</option>
              <option value="INTERESSE">Com interesse</option>
              <option value="SEM_INTERESSE">Sem interesse</option>
            </select>
          </Field>
          <Field label="Email enviado em">
            <input
              type="datetime-local"
              value={
                form.emailed_at
                  ? new Date(form.emailed_at).toISOString().slice(0, 16)
                  : ''
              }
              onChange={(e) =>
                set(
                  'emailed_at',
                  e.target.value ? new Date(e.target.value).toISOString() : null
                )
              }
              className={inputCls}
            />
          </Field>
          <Field label="Telefone em">
            <input
              type="datetime-local"
              value={
                form.phoned_at
                  ? new Date(form.phoned_at).toISOString().slice(0, 16)
                  : ''
              }
              onChange={(e) =>
                set(
                  'phoned_at',
                  e.target.value ? new Date(e.target.value).toISOString() : null
                )
              }
              className={inputCls}
            />
          </Field>
          <Field label="Idioma do script">
            <select
              value={form.preferred_language || 'en'}
              onChange={(e) => set('preferred_language', e.target.value)}
              className={inputCls}
            >
              {LANG_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Contacto principal">
            <input
              value={form.contact_name || ''}
              onChange={(e) => set('contact_name', e.target.value)}
              className={inputCls}
              placeholder="Nome"
            />
          </Field>
          <Field label="Tarifa negociada (€)">
            <input
              type="number"
              value={form.negotiated_rate ?? ''}
              onChange={(e) =>
                set(
                  'negotiated_rate',
                  e.target.value === '' ? null : Number(e.target.value)
                )
              }
              className={inputCls}
            />
          </Field>
          <Field label="Responsáveis / gestão" className="sm:col-span-2">
            <textarea
              value={form.responsibles || ''}
              onChange={(e) => set('responsibles', e.target.value)}
              rows={2}
              className={inputCls}
              placeholder="Ex.: Marie Dupont (Directora), Jean Martin (Manager)"
            />
          </Field>
          <Field label="Treinadores / especialidade" className="sm:col-span-2">
            <textarea
              value={form.coaches || ''}
              onChange={(e) => set('coaches', e.target.value)}
              rows={2}
              className={inputCls}
              placeholder="Ex.: Luca Rossi (Head Coach), Ana Bianchi"
            />
          </Field>
          <Field label="Email">
            <input
              value={form.email || ''}
              onChange={(e) => set('email', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Telefone">
            <input
              value={form.phone || ''}
              onChange={(e) => set('phone', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Cidade">
            <input
              value={form.city || ''}
              onChange={(e) => set('city', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Região">
            <input
              value={form.region || ''}
              onChange={(e) => set('region', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Morada" className="sm:col-span-2">
            <input
              value={form.address || ''}
              onChange={(e) => set('address', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Campos" className="sm:col-span-2">
            <input
              value={form.courts_info || ''}
              onChange={(e) => set('courts_info', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Infraestrutura / detalhes" className="sm:col-span-2">
            <textarea
              value={form.infrastructure || ''}
              onChange={(e) => set('infrastructure', e.target.value)}
              rows={2}
              className={inputCls}
            />
          </Field>
          <Field label="Notas internas" className="sm:col-span-2">
            <textarea
              value={form.notes || ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="Follow-ups, acordos, observações..."
            />
          </Field>
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
            onClick={() => onSave(form)}
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'A guardar...' : 'Guardar ficha'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`space-y-1 block ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {children}
    </label>
  )
}

const inputCls =
  'w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50'
