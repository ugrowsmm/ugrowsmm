import { useEffect, useRef } from 'react'
import { TURNSTILE_KEY } from '../lib/config'
import { shield } from '../lib/shield'

let loader: Promise<void> | null = null
const loadScript = () =>
  (loader ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('turnstile'))
    document.head.appendChild(s)
  }))

/** Invisible-first Cloudflare Turnstile. Renders nothing until VITE_TURNSTILE_KEY is set. */
export default function Turnstile({ onToken }: { onToken?: (t: string) => void }) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!TURNSTILE_KEY || !box.current) return
    let id: string | undefined
    let dead = false
    loadScript()
      .then(() => {
        const ts = (window as any).turnstile
        if (dead || !ts || !box.current) return
        id = ts.render(box.current, {
          sitekey: TURNSTILE_KEY,
          theme: 'light',
          callback: (t: string) => { shield.captcha = t; onToken?.(t) },
          'expired-callback': () => { shield.captcha = '' },
          'error-callback': () => { shield.captcha = '' },
        })
      })
      .catch(() => undefined)
    return () => {
      dead = true
      try { if (id) (window as any).turnstile?.remove(id) } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return TURNSTILE_KEY ? <div ref={box} className="turnstile-box" /> : null
}
