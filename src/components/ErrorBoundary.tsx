import { Component, type ErrorInfo, type ReactNode } from 'react'

const RELOAD_FLAG = 'ug_chunk_reload'

/** A page file that no longer exists after a new deploy (old tab still open) fails to load: fetch the new version once. */
export function reloadOnceForNewVersion() {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) return false
    sessionStorage.setItem(RELOAD_FLAG, '1')
  } catch {
    /* storage unavailable: still try once */
  }
  location.reload()
  return true
}

const isChunkError = (e: unknown) =>
  /Loading chunk|dynamically imported module|Importing a module script failed|error loading dynamically/i.test(String((e as Error)?.message ?? e))

/**
 * Without this, one unexpected error in any page turns the whole site into a blank white screen.
 * With it, people see a calm message and a button that brings the panel back.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UGrowSMM crashed:', error, info.componentStack)
    if (isChunkError(error)) reloadOnceForNewVersion()
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 380, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, margin: '0 auto 18px', borderRadius: 18, background: 'linear-gradient(115deg,#fb923c,#ea580c)' }} />
          <h1 style={{ margin: 0, fontSize: 22, color: '#060b18' }}>Something went wrong</h1>
          <p style={{ margin: '10px 0 22px', fontSize: 14, lineHeight: 1.6, color: '#475467' }}>
            The page hit a problem. Your wallet and orders are safe. Reload to continue.
          </p>
          <button
            type="button"
            onClick={() => {
              try { sessionStorage.removeItem(RELOAD_FLAG) } catch { /* ignore */ }
              location.reload()
            }}
            style={{ height: 46, padding: '0 26px', border: 0, borderRadius: 13, background: 'linear-gradient(115deg,#fb923c,#ea580c)', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
