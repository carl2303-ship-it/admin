/** Helpers fetch para APIs `/api/se/*` (service role no servidor + hub_staff). */

export async function seJson<T = unknown>(
  url: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  let data: T & { error?: string }
  try {
    data = (await res.json()) as T & { error?: string }
  } catch {
    data = { error: 'Resposta inválida' } as T & { error?: string }
  }
  return { ok: res.ok, status: res.status, data }
}
