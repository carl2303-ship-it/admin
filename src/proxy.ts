import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Copia cookies refreshes do cliente Supabase para um redirect (evita sessão dessincronizada). */
function redirectWithCookies(
  redirectUrl: URL,
  supabaseResponse: NextResponse
) {
  const response = NextResponse.redirect(redirectUrl)
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value)
  })
  return response
}

/** Destino pós-login seguro — nunca /login nem / (evita bounce). */
function safeNextPath(pathname: string): string {
  if (!pathname || pathname === '/' || pathname.startsWith('/login')) {
    return '/dashboard'
  }
  if (!pathname.startsWith('/')) return '/dashboard'
  return pathname
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Sem env (build/preview cedo): deixa passar; páginas tratam auth.
  if (!url || !anon) {
    return supabaseResponse
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  // getUser() alinha com hub-auth / Server Components. getClaims()-só
  // podia marcar sessão “ok” enquanto getUser() falhava → login↔dashboard loop.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isAuthenticated = Boolean(user)

  const pathname = request.nextUrl.pathname
  const isLogin = pathname === '/login' || pathname.startsWith('/login/')
  const isAuthCallback = pathname.startsWith('/auth/')
  const isPublic =
    isLogin ||
    isAuthCallback ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/_next') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/pwa-icon/')

  if (!isPublic && !isAuthenticated) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.search = ''
    redirectUrl.searchParams.set('next', safeNextPath(pathname))
    return redirectWithCookies(redirectUrl, supabaseResponse)
  }

  // Sessão válida em /login → dashboard (cookies do refresh vão no redirect).
  // Sem cookies copiados, o hub layout via getUser() falhava e reabria /login.
  if (isLogin && isAuthenticated) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    redirectUrl.search = ''
    return redirectWithCookies(redirectUrl, supabaseResponse)
  }

  if (pathname === '/') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = isAuthenticated ? '/dashboard' : '/login'
    redirectUrl.search = ''
    if (!isAuthenticated) {
      redirectUrl.searchParams.set('next', '/dashboard')
    }
    return redirectWithCookies(redirectUrl, supabaseResponse)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
