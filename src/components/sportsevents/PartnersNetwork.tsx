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
      {/* UI truncated in tool call - use file load */}
    </div>
  )
}
