import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import 'lenis/dist/lenis.css'
import './styles.css'

try {
  const ref = new URLSearchParams(location.hash.split('?')[1] ?? '').get('ref')
  if (ref) localStorage.setItem('ug_ref', ref.slice(0, 24))
} catch {
  /* storage unavailable */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* installability degrades gracefully when registration fails */
    })
  })
}

// Warm the most-used pages while the browser is idle, so moving between them feels instant.
// Skipped on Data Saver and slow connections. The first screen is never delayed (this runs after load).
window.addEventListener('load', () => {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? '')) return
  const warm = () => {
    void import('./pages/Login')
    void import('./pages/Dashboard')
    void import('./pages/NewOrder')
    void import('./pages/Orders')
    void import('./pages/AddFunds')
  }
  if ('requestIdleCallback' in window) window.requestIdleCallback(warm, { timeout: 5000 })
  else setTimeout(warm, 3000)
})

// fonts load without blocking first paint
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll<HTMLLinkElement>('link[data-font]').forEach((l) => { l.media = 'all' })
})
