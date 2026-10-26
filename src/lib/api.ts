import { SUPABASE_READY, supabase } from './supabase'

/** True when the Supabase backend is configured (otherwise the app runs as an offline demo). */
export const apiReady = () => SUPABASE_READY

/** Calls a database function. Returns the readable error text from the database, or '' on success. */
export async function rpc<T = any>(fn: string, args: Record<string, unknown> = {}): Promise<{ data: T | null; error: string }> {
  if (!SUPABASE_READY) return { data: null, error: 'not_configured' }
  try {
    const { data, error } = await supabase.rpc(fn, args)
    if (error) {
      const msg = String(error.message || 'error')
      if (msg === 'auth' || /jwt|not authenticated/i.test(msg)) {
        window.dispatchEvent(new Event('ug-auth-expired'))
        return { data: null, error: 'auth' }
      }
      return { data: null, error: msg }
    }
    return { data: data as T, error: '' }
  } catch {
    return { data: null, error: 'network' }
  }
}
