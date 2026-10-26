import { apiReady } from './api'

/** Accounts that get the Admin panel option. This only shows or hides the menu link. Real protection is the database: every admin function checks profiles.is_admin on the server. */
const ADMIN_EMAILS = ['ukay8000@gmail.com', 'ugrowsmm@gmail.com', 'umairkhan8000@gmail.com']
const DEMO_EMAIL = 'aarav@ugrowsmm.com'

export const isAdminEmail = (email: string) => ADMIN_EMAILS.includes(email.trim().toLowerCase())

/**
 * Admin panel access: the listed emails always; the demo login only while no backend is
 * connected (VITE_API_URL empty), so it switches itself off automatically once the site goes live.
 */
export const canAccessAdmin = (email: string) =>
  isAdminEmail(email) || (!apiReady() && email.trim().toLowerCase() === DEMO_EMAIL)
