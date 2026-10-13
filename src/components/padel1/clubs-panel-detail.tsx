'use client'

import { useState } from 'react'
import {
  assignClubOwner,
  createPlatformCheckout,
  generateLicenseKey,
  removeClubOwner,
  sendCheckoutEmail,
  updateClub,
  updateClubContract,
} from '@/lib/padel1/actions'
import type { Padel1Club, Padel1ClubForm, Padel1LicenseKey } from '@/lib/padel1/types'
import { ModuleToggles } from './module-toggles'
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  fieldClass,
} from './ui'

function clubToForm(c: Padel1Club): Padel1ClubForm {
  return {
    name: c.name || '',
    description: c.description || '',
    city: c.city || '',
    address: c.address || '',
    country: c.country || 'Portugal',
    phone: c.phone || '',
    email: c.email || '',
    website: c.website || '',
    logo_url: c.logo_url || '',
    photo_url_1: c.photo_url_1 || '',
    photo_url_2: c.photo_url_2 || '',
    plan_type: c.plan_type || 'bronze',
  }
}

export function ClubFormFields({
  form,
  setForm,
}: {
  form: Padel1ClubForm
  setForm: (f: Padel1ClubForm) => void
}) {
  const set = (key: keyof Padel1ClubForm, value: string) =>
    setForm({ ...form, [key]: value })
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {(
        [
          ['name', 'Nome'],
          ['city', 'Cidade'],
          ['address', 'Morada'],
          ['country', 'País'],
          ['phone', 'Telefone'],
          ['email', 'Email'],
          ['website', 'Website'],
          ['logo_url', 'Logo URL'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="text-xs font-semibold text-zinc-600">
          {label}
          <input
            className={`${fieldClass} mt-1`}
            value={form[key]}
            onChange={(e) => set(key, e.target.value)}
          />
        </label>
      ))}
      <label className="text-xs font-semibold text-zinc-600 sm:col-span-2">
        Descrição
        <textarea
          className={`${fieldClass} mt-1`}
          rows={2}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </label>
      <label className="text-xs font-semibold text-zinc-600">
        Plano
        <select
          className={`${fieldClass} mt-1`}
          value={form.plan_type}
          onChange={(e) => set('plan_type', e.target.value)}
        >
          <option value="bronze">bronze</option>
          <option value="silver">silver</option>
          <option value="gold">gold</option>
        </select>
      </label>
    </div>
  )
}
