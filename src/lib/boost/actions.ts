'use server'

import { revalidatePath } from 'next/cache'
import {
  requireBoostModule,
  canWriteBoost,
  canWriteBoostContent,
  staffRole,
} from './auth'
import { requireBoostClient, invokeBoostEdgeFunction } from './client'
import { PLAN_MAX_TOURNAMENTS } from './types'

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string }

async function guardWrite(): Promise<
  | { ok: true; boostUserId: string | null }
  | { ok: false; error: string }
> {
  const auth = await requireBoostModule()
  if (!auth.user) return { ok: false, error: 'Não autenticado' }
  if (auth.error && !auth.isBootstrap) return { ok: false, error: auth.error }
  const role = staffRole(auth.staff, auth.isBootstrap)
  if (!canWriteBoost(role)) {
    return { ok: false, error: 'Sem permissão de escrita (owner/commerce).' }
  }
  return { ok: true, boostUserId: auth.staff?.boost_user_id ?? null }
}

async function guardContentWrite(): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  const auth = await requireBoostModule()
  if (!auth.user) return { ok: false, error: 'Não autenticado' }
  if (auth.error && !auth.isBootstrap) return { ok: false, error: auth.error }
  const role = staffRole(auth.staff, auth.isBootstrap)
  if (!canWriteBoostContent(role)) {
    return {
      ok: false,
      error: 'Sem permissão de escrita de conteúdo (owner/commerce/content).',
    }
  }
  return { ok: true }
}

function revalidateBoost(paths: string[] = []) {
  revalidatePath('/produtos/boost')
  for (const p of paths) revalidatePath(p)
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// --- Products ---

function parseJsonArray(raw: string): unknown[] {
  try {
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function uploadBoostImage(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const g = await guardContentWrite()
  if (!g.ok) return g

  try {
    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: 'Ficheiro em falta' }
    }
    const allowed = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ]
    if (!allowed.includes(file.type)) {
      return { ok: false, error: 'Tipo de ficheiro não suportado' }
    }
    if (file.size > 5 * 1024 * 1024) {
      return { ok: false, error: 'Imagem > 5MB' }
    }

    const folder = String(formData.get('folder') || 'products')
      .replace(/[^a-z0-9/_-]/gi, '')
      .replace(/^\/+|\/+$/g, '') || 'products'
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

    const client = requireBoostClient()
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error } = await client.storage.from('product-images').upload(path, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })
    if (error) return { ok: false, error: error.message }

    const { data } = client.storage.from('product-images').getPublicUrl(path)
    return { ok: true, url: data.publicUrl }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro upload' }
  }
}
