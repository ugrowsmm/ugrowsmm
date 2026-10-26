// Public config only. Real secrets live in Apps Script (Script Properties), never here.
export const API_URL = import.meta.env.VITE_API_URL ?? 'https://script.google.com/macros/s/AKfycbziNjNImCdFaOd00jA7BGOUa9DqAhgWXRXtcFntywdkutCjLudzyAwzReXjRrTgBAR0/exec'
export const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY ?? 'PASTE_WEB3FORMS_PUBLIC_ACCESS_KEY'
export const REFERRAL_PERCENT_DEFAULT = 10
export const UPI_ID = import.meta.env.VITE_UPI_ID ?? 'PASTE_YOUR_UPI_ID@bank'
export const UPI_NAME = 'UGrowSMM'
export const TURNSTILE_KEY = import.meta.env.VITE_TURNSTILE_KEY ?? ''

// Marketing numbers shown on the public pages. Keep these true; update them as you grow.
export const USERS_LABEL = '50K+'
export const SINCE_YEAR = 2019
export const ORDERS_LABEL = '1 Million+'
export const ORDER_EVERY_LABEL = '0.3s'
export const PRICE_FROM_LABEL = '₹1/1K'
