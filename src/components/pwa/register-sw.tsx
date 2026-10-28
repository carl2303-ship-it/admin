'use client'

import { useEffect } from 'react'

/** Regista o service worker para a PWA ser instalável (Add to Home Screen). */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV === 'development') return

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* silencioso — SW opcional em preview */
      })
    }

    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }, [])

  return null
}
