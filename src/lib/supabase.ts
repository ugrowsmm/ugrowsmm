import { createClient } from '@supabase/supabase-js'

// Both values are public by design (the key is the "publishable" one). Real protection is the database rules in supabase/schema.sql.
// Vercel env vars VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY win when set.
const URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://efjevpvhzbfwqvrcpavt.supabase.co'
const KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || 'sb_publishable_z2UdrP_j1_ZQ53u_ioQnTQ_3BOTXEKd'

export const SUPABASE_READY = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(URL) && KEY.startsWith('sb_')

export const supabase = createClient(URL, KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
})
