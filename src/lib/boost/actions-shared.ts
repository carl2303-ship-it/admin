import { revalidatePath } from 'next/cache'
import { requireHubStaff } from '@/lib/auth/hub-auth'
import { roleCanAccess } from '@/lib/auth/roles'
import { canWritePadel1 } from '@/lib/padel1/auth'
import {
  requireBoostModule,
  canWriteBoost,
  canWriteBoostContent,
  staffRole,
} from './auth'

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string }

export async function guardWrite(): Promise<
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

/**
 * SaaS Tour vive no Padel One HQ; dados continuam no Boost.
 * Escrita: owner/platform (HQ) ou owner/commerce (legado Boost).
 */
export async function guardSaasWrite(): Promise<
  | { ok: true; boostUserId: string | null }
  | { ok: false; error: string }
> {
  const auth = await requireHubStaff()
  if (!auth.user) return { ok: false, error: 'Não autenticado' }
  if (auth.error && !auth.isBootstrap) return { ok: false, error: auth.error }
  const role = staffRole(auth.staff, auth.isBootstrap)
  if (role !== 'bootstrap') {
    const canSee =
      roleCanAccess(role, 'padel1') || roleCanAccess(role, 'boost')
    if (!canSee) {
      return { ok: false, error: 'Sem permissão para SaaS Tour.' }
    }
    if (!canWritePadel1(role) && !canWriteBoost(role)) {
      return {
        ok: false,
        error: 'Sem permissão de escrita SaaS (owner/platform/commerce).',
      }
    }
  }
  return { ok: true, boostUserId: auth.staff?.boost_user_id ?? null }
}

export async function guardContentWrite(): Promise<
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

export function revalidateBoost(paths: string[] = []) {
  revalidatePath('/produtos/boost')
  for (const p of paths) revalidatePath(p)
}

export function revalidateSaas() {
  revalidatePath('/produtos/padel1/saas')
  revalidatePath('/produtos/boost/saas')
  revalidatePath('/metricas/boost')
  revalidatePath('/dashboard')
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
