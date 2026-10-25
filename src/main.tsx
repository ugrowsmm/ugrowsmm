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

// fonts load without blocking first paint
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll<HTMLLinkElement>('link[data-font]').forEach((l) => { l.media = 'all' })
})
