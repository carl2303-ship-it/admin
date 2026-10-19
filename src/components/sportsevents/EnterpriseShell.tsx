'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { seJson } from '@/lib/sportsevents/se-api'
import {
  Building2,
  MapPin,
  Briefcase,
  Calendar,
  Plus,
  Calculator,
  IdCard,
  Settings,
  Newspaper,
  Megaphone,
} from 'lucide-react'
import RentabilidadeTorneios from '@/components/sportsevents/RentabilidadeTorneios'
import PartnersNetwork from '@/components/sportsevents/PartnersNetwork'
import { HubPackagesPanel } from '@/components/sportsevents/HubPackagesPanel'
import { BlogAdminPanel } from '@/components/sportsevents/BlogAdminPanel'
import { SocialAdminPanel } from '@/components/sportsevents/SocialAdminPanel'
import { StagesCalendar } from '@/components/sportsevents/StagesCalendar'
import {
  CreatePartnerModal,
  CreateLeadModal,
  type LookupOption,
} from '@/components/sportsevents/CreateModals'
import { EventFichaModal, type EventRow } from '@/components/sportsevents/EventFichaModal'
import type { PartnerTypeValue } from '@/lib/sportsevents/partner-types'
import {
  computeStageMetrics,
  formatEur,
  type BookingLite,
} from '@/lib/sportsevents/stage-metrics'
import type {
  PackageBookingLite,
  TransferLogLite,
} from '@/lib/sportsevents/stage-analytics'

export type SeShellTab =
  | 'kpis'
  | 'pipeline'
  | 'partners'
  | 'events'
  | 'blog'
  | 'social'
  | 'roi'

export function EnterpriseShell({
  initialTab = 'kpis',
  initialEventsSubTab = 'packages',
  hideChromeNav = false,
}: {
  initialTab?: SeShellTab
  initialEventsSubTab?: 'packages' | 'dated'
  /** Quando true, esconde a nav interna (usa module-nav do hub). */
  hideChromeNav?: boolean
}) {
  const [activeTab, setActiveTab] = useState<SeShellTab>(initialTab)
  const [eventsSubTab, setEventsSubTab] = useState<'packages' | 'dated'>(
    initialEventsSubTab
  )
  const [leads, setLeads] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [bookings, setBookings] = useState<BookingLite[]>([])
  const [packageBookings, setPackageBookings] = useState<PackageBookingLite[]>(
    []
  )
  const [transferLogs, setTransferLogs] = useState<TransferLogLite[]>([])
  const [destinations, setDestinations] = useState<LookupOption[]>([])
  const [sports, setSports] = useState<LookupOption[]>([])
  const [loading, setLoading] = useState(true)
  const [managerFilter, setManagerFilter] = useState<string>('ALL')
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null)
  const [showClubModal, setShowClubModal] = useState(false)
  const [partnerModalType, setPartnerModalType] =
    useState<PartnerTypeValue>('CLUBE_PADEL')

  useEffect(() => {
    loadEnterpriseData()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'partners') {
      setActiveTab('partners')
    }
    if (params.get('tab') === 'blog') {
      setActiveTab('blog')
    }
    const stripe = params.get('stripe')
    const account = params.get('account')
    if ((stripe === 'return' || stripe === 'refresh') && account) {
      void (async () => {
        const { ok, data } = await seJson<{
          partners?: { id: string; stripe_account_id?: string | null }[]
        }>('/api/se/data')
        const partner = ok
          ? data.partners?.find((p) => p.stripe_account_id === account)
          : null
        if (partner?.id) {
          await fetch(
            `/api/se/stripe/connect-account?partnerId=${encodeURIComponent(partner.id)}`
          )
        }
        await loadEnterpriseData()
      })()
    }
  }, [])

  async function loadEnterpriseData() {
    setLoading(true)
    const { ok, data } = await seJson<{
      leads?: any[]
      partners?: any[]
      events?: any[]
      bookings?: BookingLite[]
      packageBookings?: PackageBookingLite[]
      transferLogs?: TransferLogLite[]
      destinations?: LookupOption[]
      sports?: LookupOption[]
      error?: string
    }>('/api/se/data')
    if (!ok) {
      console.error(data.error)
      setLoading(false)
      return
    }
    setLeads(data.leads || [])
    setPartners(data.partners || [])
    setEvents(data.events || [])
    setBookings(data.bookings || [])
    setPackageBookings(data.packageBookings || [])
    setTransferLogs(data.transferLogs || [])
    setDestinations(data.destinations || [])
    setSports(data.sports || [])
    setLoading(false)
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 font-sans flex flex-col overflow-hidden">
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2 font-[family-name:var(--font-display)]">
              SportsEvents{' '}
              <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-mono">
                ENTERPRISE ERP
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Gestão Multinacional Ibérica (Algarve · Barcelona · Marbella)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setManagerFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${managerFilter === 'ALL' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Visão Global
            </button>
            <button
              onClick={() => setManagerFilter('PAI')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${managerFilter === 'PAI' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              🇵🇹 Operações Algarve (Pai)
            </button>
            <button
              onClick={() => setManagerFilter('FILHO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${managerFilter === 'FILHO' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              🇪🇸 Comercial / Espanha (Filho)
            </button>
          </div>
        </div>
      </header>

      {!hideChromeNav && (
      <nav className="bg-slate-900/50 border-b border-slate-800 px-6 flex gap-6 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('kpis')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-all ${activeTab === 'kpis' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Calendar className="w-4 h-4" /> Calendário de Estágios
        </button>
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-all ${activeTab === 'pipeline' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Briefcase className="w-4 h-4" /> Pipeline de Vendas & CRM
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-all ${activeTab === 'events' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Calendar className="w-4 h-4" /> Estágios & Eventos Operacionais
        </button>
        <button
          onClick={() => setActiveTab('partners')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-all ${activeTab === 'partners' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Building2 className="w-4 h-4" /> Rede de Parceiros (ERP)
        </button>
        <button
          onClick={() => setActiveTab('blog')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-all ${activeTab === 'blog' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Newspaper className="w-4 h-4" /> Blog SEO
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-all ${activeTab === 'social' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Megaphone className="w-4 h-4" /> Redes sociais
        </button>
        <button
          onClick={() => setActiveTab('roi')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-all ${activeTab === 'roi' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Calculator className="w-4 h-4" /> Rentabilidade Torneios
        </button>
        <Link
          href="/produtos/sportsevents/simulador"
          className="py-3 flex items-center gap-2 border-b-2 border-transparent text-slate-400 hover:text-amber-400 hover:border-amber-400/50 transition-all"
        >
          <Calculator className="w-4 h-4" /> Simulador Financeiro
        </Link>
        <Link
          href="/produtos/sportsevents/cartoes"
          className="py-3 flex items-center gap-2 border-b-2 border-transparent text-slate-400 hover:text-amber-400 hover:border-amber-400/50 transition-all"
        >
          <IdCard className="w-4 h-4" /> Cartões digitais
        </Link>
        <Link
          href="/produtos/sportsevents/definicoes"
          className="py-3 flex items-center gap-2 border-b-2 border-transparent text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-all"
        >
          <Settings className="w-4 h-4" /> Definições
        </Link>
      </nav>
      )}

      <main className="p-6 flex-1 overflow-y-auto">
        {activeTab === 'kpis' && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-slate-900 border border-slate-800 p-8 text-center rounded-2xl text-xs text-slate-500">
                A carregar calendário...
              </div>
            ) : (
              <StagesCalendar
                events={events}
                bookings={bookings}
                packageBookings={packageBookings}
                transferLogs={transferLogs}
                managerFilter={managerFilter}
                onEditEvent={(event) => {
                  setEditingEvent(event as EventRow)
                  setShowEventModal(true)
                }}
              />
            )}
          </div>
        )}

        {activeTab === 'partners' && (
          <PartnersNetwork
            partners={partners}
            onRefresh={loadEnterpriseData}
            onRequestAddPartner={(type) => {
              setPartnerModalType(type || 'CLUBE_PADEL')
              setShowClubModal(true)
            }}
          />
        )}

        {activeTab === 'blog' && <BlogAdminPanel />}

        {activeTab === 'social' && <SocialAdminPanel />}

        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">
                Pipeline de Vendas & Pedidos de Orçamento
              </h2>
              <button
                type="button"
                onClick={() => setShowLeadModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Inserir Novo Lead Manual
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Cliente / Clube</th>
                    <th className="p-3">Modalidade</th>
                    <th className="p-3">Destino</th>
                    <th className="p-3">Pax</th>
                    <th className="p-3">Faturação Prevista</th>
                    <th className="p-3">Probabilidade</th>
                    <th className="p-3">Atribuído a</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {leads.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-8 text-center text-slate-500"
                      >
                        Sem leads ainda. Clica em &quot;Inserir Novo Lead Manual&quot;
                        para criar o primeiro.
                      </td>
                    </tr>
                  ) : (
                    leads.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/50">
                      <td className="p-3">
                        <div className="font-bold text-white">{l.client_name}</div>
                        <div className="text-[10px] text-slate-400">
                          {l.company_or_club || l.client_email}
                        </div>
                        {l.source === 'stage_builder' && (
                          <span className="mt-1 inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                            App Builder
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-cyan-400">
                        {l.sports?.name || 'Padel'}
                      </td>
                      <td className="p-3 text-slate-300">
                        {l.destinations?.name || 'Algarve'}
                      </td>
                      <td className="p-3 font-bold">{l.group_size} pax</td>
                      <td className="p-3 font-bold text-emerald-400">
                        {l.estimated_revenue || 0} €
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-950 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-400 h-full"
                              style={{ width: `${l.probability || 50}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {l.probability || 50}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-300">
                        {l.assigned_to}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {l.status}
                        </span>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'roi' && <RentabilidadeTorneios />}

        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Estágios & Eventos Operacionais
                </h2>
                <p className="text-xs text-slate-400">
                  Pacotes do catálogo (site + construtor) e edições datadas com
                  Stripe.
                </p>
              </div>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setEventsSubTab('packages')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    eventsSubTab === 'packages'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pacotes (catálogo)
                </button>
                <button
                  type="button"
                  onClick={() => setEventsSubTab('dated')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    eventsSubTab === 'dated'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Edições datadas
                </button>
              </div>
            </div>

            {eventsSubTab === 'packages' ? (
              <HubPackagesPanel />
            ) : (
              <>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingEvent(null)
                  setShowEventModal(true)
                }}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Novo Evento
              </button>
            </div>

            {loading ? (
              <div className="bg-slate-900 border border-slate-800 p-8 text-center rounded-2xl text-xs text-slate-500">
                A carregar eventos...
              </div>
            ) : events.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-8 text-center rounded-2xl text-xs text-slate-500">
                Sem eventos. Cria a primeira ficha completa com programa, hotel,
                preços e publicação no site.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((e) => {
                  const m = computeStageMetrics(e, bookings)
                  return (
                  <div
                    key={e.id}
                    className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-white">{e.title}</h3>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {e.destinations?.name || 'N/D'} · {e.sports?.name || 'Padel'}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {e.status}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            e.published
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}
                        >
                          {e.published ? 'No site' : 'Rascunho'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>
                        <span className="text-slate-500">Datas</span>
                        <div className="text-slate-200 font-semibold">
                          {e.start_date} → {e.end_date}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Preço / pax</span>
                        <div className="text-emerald-400 font-bold">
                          {formatEur(m.pricePerPerson)}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Clientes / vagas</span>
                        <div className="text-slate-200 font-semibold">
                          {m.bookedPax} / {m.maxPax}{' '}
                          <span className="text-cyan-400">({m.spotsLeft} livres)</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Lucro planeado</span>
                        <div
                          className={`font-bold ${
                            m.plannedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatEur(m.plannedProfit)}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Custo</span>
                        <div className="text-slate-200">{formatEur(m.totalCost)}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Cobrado</span>
                        <div className="text-cyan-400 font-semibold">
                          {formatEur(m.bookedAmount)}
                        </div>
                      </div>
                    </div>

                    {(e.hotel_name || e.coaches) && (
                      <div className="text-[11px] text-slate-400 space-y-0.5 border-t border-slate-800 pt-2">
                        {e.hotel_name && <div>Hotel: {e.hotel_name}</div>}
                        {e.coaches && (
                          <div className="line-clamp-2">Treinadores: {e.coaches}</div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEvent(e)
                          setShowEventModal(true)
                        }}
                        className="flex-1 text-[11px] font-semibold rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-400"
                      >
                        Editar ficha
                      </button>
                      {e.published && e.slug && (
                        <Link
                          href={`https://sportsevents.app/eventos/${e.slug}`}
                          className="flex-1 text-center text-[11px] font-semibold rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-400 hover:bg-emerald-500/20"
                        >
                          Ver no site
                        </Link>
                      )}
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
              </>
            )}
          </div>
        )}
      </main>

      {showLeadModal && (
        <CreateLeadModal
          destinations={destinations}
          sports={sports}
          onClose={() => setShowLeadModal(false)}
          onCreated={loadEnterpriseData}
        />
      )}
      {showEventModal && (
        <EventFichaModal
          destinations={destinations}
          sports={sports}
          initial={editingEvent}
          onClose={() => {
            setShowEventModal(false)
            setEditingEvent(null)
          }}
          onSaved={loadEnterpriseData}
        />
      )}
      {showClubModal && (
        <CreatePartnerModal
          key={partnerModalType}
          destinations={destinations}
          initialType={partnerModalType}
          onClose={() => setShowClubModal(false)}
          onCreated={loadEnterpriseData}
        />
      )}
    </div>
  )
}
