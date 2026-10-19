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
    PLACEHOLDER_TRUNCATED