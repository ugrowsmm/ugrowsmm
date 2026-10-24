import { API_URL } from './config'
import { shield } from './shield'

export const TOKEN_KEY = 'ug_token'
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) ?? '' } catch { return '' } }

export const apiReady = () => /^https:\/\/script\.google(usercontent)?\.com\//.test(API_URL)

/** Calls the Apps Script backend. text/plain avoids a CORS preflight. Returns {error} on any failure. */
export async function callApi<T = any>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T & { error?: string }> {
  if (!apiReady()) return { error: 'not_configured' } as any
  try {
    const r = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, captcha: shield.captcha, hp: shield.hp, token: getToken(), ...payload }),
    })
    const j = await r.json()
    if (j && j.error === 'auth') window.dispatchEvent(new Event('ug-auth-expired'))
    return j
  } catch {
    return { error: 'network' } as any
  }
}
