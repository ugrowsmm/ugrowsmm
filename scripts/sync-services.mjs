// Pulls the provider's service list (secsers.com, Perfect Panel API) and writes src/lib/catalog.generated.json.
//
//   PROVIDER_API_KEY=xxxx USD_INR=88 node scripts/sync-services.mjs
//   node scripts/sync-services.mjs scripts/sample-provider.json     (offline test, no key needed)
//
// Optional: PROVIDER_API_URL (default https://secsers.com/api/v2)
// What it does: no TikTok; only plain link + quantity services; clean names such as
// "Followers · Non-drop · 30-day refill"; types (Followers, Likes, Repost, Views, Shares, Growth ...);
// Indian services stay in the main list (and also show under the India chip); other countries get their own group
// ("🇺🇸 USA", "🇸🇦 Saudi Arabia", "🌍 Gulf" ...) shown last. Grades are decided by quality, not price. Pakistan is excluded.
// Prices stay at provider cost converted USD -> INR; the site multiplies by MARKUP (src/lib/data.ts).
import { readFileSync, writeFileSync } from 'node:fs'

const url = process.env.PROVIDER_API_URL || 'https://secsers.com/api/v2'
const key = process.env.PROVIDER_API_KEY
const USD_INR = Number(process.env.USD_INR || 88)
const file = process.argv[2]

let list
if (file) list = JSON.parse(readFileSync(file, 'utf8'))
else {
  if (!key) throw new Error('Set PROVIDER_API_KEY first (or pass a saved JSON file to test offline).')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ key, action: 'services' }),
  })
  list = await res.json()
}
if (!Array.isArray(list)) throw new Error('Unexpected provider response: ' + JSON.stringify(list).slice(0, 200))

/* ---------- what to keep ---------- */
// Edit freely: anything matching this is left out of the site.
const EXCLUDE = /scraper|direct message|\bdm\b|\bads?\b|advert|nft|statistic|analytic|report|mention|verified|review|trustpilot|tripadvisor|google map|steam|\bseo\b|backlink|poll|\bspace\b|communit|live ?stream|\blive\b|\bauto\b|\bbots?\b|monetiz|pakistan|🇵🇰|\bpak\b/i

const PLATFORMS = [
  ['tiktok', /tik ?tok/i], // recognised only so it can be dropped
  ['jiosaavn', /jio ?saavn/i],
  ['instagram', /insta/i],
  ['youtube', /you ?tube|\byt\b/i],
  ['facebook', /facebook|\bfb\b/i],
  ['snapchat', /snap ?chat/i],
  ['spotify', /spotify/i],
  ['telegram', /telegram/i],
  ['x', /twitter|\bx\b ?[-–]|\bx\b followers/i],
  ['threads', /threads/i],
  ['whatsapp', /whatsapp/i],
  ['linkedin', /linkedin/i],
  ['twitch', /twitch/i],
  ['kick', /\bkick\b/i],
  ['soundcloud', /soundcloud/i],
  ['pinterest', /pinterest/i],
  ['website', /website|web traffic/i],
]
const platformOf = (t) => PLATFORMS.find(([, re]) => re.test(t))?.[0] ?? null

const TYPES = [
  ['Growth', /growth|combo|package|engagement|bundle/i],
  ['Repost', /re-?post|re-?tweet|re-?share/i],
  ['Shares', /share/i],
  ['Subscribers', /subscriber/i],
  ['Members', /member/i],
  ['Followers', /follower|\bfans?\b/i],
  ['Reactions', /reaction/i],
  ['Likes', /like/i],
  ['Watch time', /watch ?(time|hour)/i],
  ['Views', /view|impression|reach/i],
  ['Plays', /\bplays?\b|listener|stream/i],
  ['Saves', /\bsaves?\b/i],
  ['Comments', /comment/i],
  ['Traffic', /traffic|visit/i],
]
const typeOf = (name, cat) =>
  TYPES.find(([, re]) => re.test(name))?.[0] ?? TYPES.find(([, re]) => re.test(cat))?.[0] ?? null

/* ---------- country-wise ---------- */
const COUNTRIES = [
  ['USA', '🇺🇸', /\busa\b|united states|🇺🇸/i],
  ['India', '🇮🇳', /india|🇮🇳/i],
  ['Gulf', '🌍', /\bgulf\b/i],
  ['Saudi Arabia', '🇸🇦', /saudi|🇸🇦/i],
  ['Gulf', '🌍', /arab|\buae\b|emirates|kuwait|qatar|bahrain|oman|iraq|jordan|egypt|🇦🇪|🇰🇼|🇶🇦|🇧🇭|🇴🇲|🇮🇶|🇯🇴|🇪🇬/i],
  ['UK', '🇬🇧', /\buk\b|united kingdom|🇬🇧/i],
  ['Europe', '🇪🇺', /europe|🇪🇺/i],
  ['Brazil', '🇧🇷', /brazil|🇧🇷/i],
  ['Turkey', '🇹🇷', /turk|🇹🇷/i],
  ['Bangladesh', '🇧🇩', /bangladesh|🇧🇩/i],
  ['Indonesia', '🇮🇩', /indonesia|🇮🇩/i],
  ['Germany', '🇩🇪', /german|🇩🇪/i],
  ['France', '🇫🇷', /france|french|🇫🇷/i],
  ['Canada', '🇨🇦', /canada|🇨🇦/i],
  ['Australia', '🇦🇺', /australia|🇦🇺/i],
]
const GULF_SUB = /kuwait|qatar|bahrain|oman|\buae\b|iraq|jordan|egypt/i
const countryOf = (t) => COUNTRIES.find(([, , re]) => re.test(t)) ?? null

/* ---------- name parts ---------- */
const refillOf = (t) => {
  if (/lifetime|life ?time/i.test(t)) return { kind: 'life', label: 'Lifetime refill' }
  const d = t.match(/(\d{1,3})\s*[- ]?\s*days?\s*(?:auto\s*)?refill/i)
  if (d && Number(d[1]) > 0) return { kind: Number(d[1]), label: `${Number(d[1])}-day refill` }
  if (/no[- ]?refill|non[- ]?refill/i.test(t)) return { kind: 0, label: '' }
  if (/refill/i.test(t)) return { kind: 30, label: 'Refill' }
  return { kind: 0, label: '' }
}
const dropOf = (t) => (/non[- ]?drop|no[- ]?drop|0% ?drop|zero ?drop/i.test(t) ? 'Non-drop' : /low[- ]?drop/i.test(t) ? 'Low drop' : '')
const LIKE_COUNT = new Set(['Followers', 'Subscribers', 'Members', 'Likes'])

const BASE = {
  Followers: 'Profiles that follow your account, added at a steady pace so growth looks natural.',
  Subscribers: 'Subscribers added gradually to your channel for a believable, steady climb.',
  Members: 'Members joining your channel or group so it looks active from the first visit.',
  Likes: 'Visible likes on your post, added quickly so new visitors see proof right away.',
  Repost: 'Reposts that push your content to more feeds and make it look worth passing on.',
  Views: 'Views on your video or post, so every new upload gets a busy first hour.',
  Shares: 'Share counts that show your content is worth passing on.',
  Comments: 'Ready-made comments that add life under your post. Billed per comment.',
  Plays: 'Plays on your track or playlist to lift its numbers and discovery.',
  Saves: 'Saves on your content, a strong signal that it is worth coming back to.',
  Reactions: 'Reactions on your post to boost visible engagement.',
  'Watch time': 'Watch hours for creators aiming at the monetisation mark. Quantity is in hours.',
  Traffic: 'Visitors sent to your website link, delivered gradually over time.',
  Growth: 'A combined growth bundle that lifts several numbers together.',
}

const rows = []
for (const s of list) {
  const raw = `${s.category ?? ''} ${s.name ?? ''}`
  const platform = platformOf(raw)
  if (!platform || platform === 'tiktok') continue
  if (EXCLUDE.test(raw)) continue
  if (s.type && !/^default$/i.test(String(s.type))) continue // only plain link + quantity services
  const min = Number(s.min), max = Number(s.max)
  if (!(max > min)) continue // fixed-size packages do not fit a per-1,000 order form
  const type = typeOf(String(s.name), String(s.category ?? ''))
  if (!type) continue

  const text = String(s.name)
  const c = countryOf(raw)
  const refill = refillOf(text)
  const drop = dropOf(text)
  const fast = /fast|instant|express/i.test(text)

  // grade by QUALITY signals, never by price: refill cover, drop rate, guarantee, real profiles, targeting
  const days = refill.kind === 'life' ? 365 : refill.kind
  let score = days >= 180 ? 4 : days >= 90 ? 3 : days >= 30 ? 2 : days > 0 ? 1 : 0
  score += drop === 'Non-drop' ? 2 : drop === 'Low drop' ? 1 : 0
  score += /real|high[- ]?quality|premium|verified/i.test(text) ? 1 : 0
  score += /guarantee/i.test(text) ? 1 : 0
  score += c ? 1 : 0 // targeted audiences are a better source
  score -= /\bmix\b|\bbots?\b/i.test(text) ? 1 : 0
  const quality = score >= 4 ? 'Pro' : score >= 2 ? 'Premium' : 'Standard'

  const isIndia = c?.[0] === 'India'
  const sub = c?.[0] === 'Gulf' ? (raw.match(GULF_SUB)?.[0] ?? '') : ''
  const subLabel = sub ? sub.replace(/^\w/, (m) => m.toUpperCase()).replace(/^Uae$/i, 'UAE') : ''
  const dropTag = drop || (!refill.label && LIKE_COUNT.has(type) ? 'Drop' : '')
  // name = type · grade · drop / non-drop · refill time   (Indian services say "Indian" up front)
  const name = [`${isIndia ? 'Indian ' : ''}${type}`, subLabel, quality, dropTag, refill.label].filter(Boolean).join(' · ')

  const speed = text.match(/(\d+(?:\.\d+)?\s?[KkMm]?)\s*\/\s*day/i)?.[1]?.replace(/\s/g, '').toUpperCase()
  const description = [
    BASE[type],
    refill.kind === 'life' ? 'Backed by lifetime refill cover.' : refill.kind ? `Backed by ${refill.label.toLowerCase().replace('-day', ' day')} cover.` : '',
    drop === 'Non-drop' ? 'Built to hold, with no drop expected.' : drop === 'Low drop' ? 'Low drop rate.' : '',
    c ? `Targeted to ${c[0]}${subLabel ? ` (${subLabel})` : ''} audiences.` : '',
  ].filter(Boolean).join(' ')

  rows.push({
    id: String(s.service), platform,
    // Indian services sit in the main list (and show under the India chip too); other countries only in their own group
    category: c && !isIndia ? `${c[1]} ${c[0]}` : type,
    country: c ? c[0] : undefined,
    name, rate: Math.round(Number(s.rate) * USD_INR * 100) / 100, min, max,
    avgTime: s.time ?? (speed ? `Up to ${speed}/day` : '0–24 hrs'),
    quality, description,
  })
}

// one clean entry per name: when several providers' variants collapse to the same name, keep the cheapest
const best = new Map()
for (const r of rows) {
  const k = `${r.platform}|${r.category}|${r.name}`
  if (!best.has(k) || r.rate < best.get(k).rate) best.set(k, r)
}
const out = [...best.values()].sort((a, b) => a.platform.localeCompare(b.platform) || a.rate - b.rate)

writeFileSync(new URL('../src/lib/catalog.generated.json', import.meta.url), JSON.stringify(out, null, 1))
const by = {}
out.forEach((r) => (by[r.platform] = (by[r.platform] ?? 0) + 1))
console.log(`Wrote ${out.length} services (from ${list.length}).`, by)
