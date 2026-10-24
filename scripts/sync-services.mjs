// Pulls your provider's full service list and writes src/lib/catalog.generated.json.
// Usage:  PROVIDER_API_URL=https://... PROVIDER_API_KEY=... node scripts/sync-services.mjs
// Prices stay at provider cost; the site multiplies by MARKUP (src/lib/data.ts).
import { writeFileSync } from 'node:fs'

const url = process.env.PROVIDER_API_URL
const key = process.env.PROVIDER_API_KEY
if (!url || !key) throw new Error('Set PROVIDER_API_URL and PROVIDER_API_KEY first.')

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ key, action: 'services' }),
})
const list = await res.json()
if (!Array.isArray(list)) throw new Error('Unexpected provider response: ' + JSON.stringify(list).slice(0, 200))

const platformOf = (t) =>
  /insta/i.test(t) ? 'instagram' : /you ?tube|yt\b/i.test(t) ? 'youtube' : /telegram/i.test(t) ? 'telegram'
  : /tiktok/i.test(t) ? 'tiktok' : /facebook|fb\b/i.test(t) ? 'facebook' : /twitter|\bx\b/i.test(t) ? 'x'
  : /spotify/i.test(t) ? 'spotify' : null

// group by platform + category, then rank by price: cheapest third Standard, middle Premium, top third Pro
const groups = new Map()
for (const s of list) {
  const platform = platformOf(`${s.category} ${s.name}`)
  if (!platform) continue
  const k = `${platform}|${s.category}`
  groups.set(k, [...(groups.get(k) ?? []), { ...s, platform }])
}

const COPY = {
  Standard: 'A budget-friendly pick for quick momentum. Great for testing a new page or going big on volume.',
  Premium: 'Higher-quality sources with steadier results. The grade most serious creators settle on.',
  Pro: 'Top-shelf quality with the strongest stability we offer. Built for launches and brands that cannot afford a drop.',
}

const out = []
for (const items of groups.values()) {
  items.sort((a, b) => Number(a.rate) - Number(b.rate))
  items.forEach((s, i) => {
    const t = items.length < 3 ? (i === 0 ? 'Standard' : 'Pro') : i < items.length / 3 ? 'Standard' : i < (2 * items.length) / 3 ? 'Premium' : 'Pro'
    out.push({
      id: String(s.service), platform: s.platform, category: String(s.category).replace(/^[^a-z]*(instagram|youtube|telegram|tiktok|facebook|twitter|spotify)\W*/i, '') || String(s.category),
      name: String(s.name).slice(0, 80), rate: Number(s.rate), min: Number(s.min), max: Number(s.max),
      avgTime: s.time ?? '0–24 hrs', quality: t, description: COPY[t],
    })
  })
}
writeFileSync(new URL('../src/lib/catalog.generated.json', import.meta.url), JSON.stringify(out, null, 1))
console.log(`Wrote ${out.length} services.`)
