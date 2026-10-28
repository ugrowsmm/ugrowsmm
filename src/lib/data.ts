import synced from './catalog.generated.json'
export type Platform =
  | 'instagram'
  | 'youtube'
  | 'facebook'
  | 'snapchat'
  | 'spotify'
  | 'jiosaavn'
  | 'website'
  | 'telegram'
  | 'x'
  | 'threads'
  | 'whatsapp'
  | 'linkedin'
  | 'twitch'
  | 'kick'
  | 'soundcloud'
  | 'pinterest'
  | 'audiomack'
  | 'trovo'
  | 'vk'
  | 'kwai'
  | 'likee'
  | 'reddit'
  | 'tumblr'
  | 'deezer'
  | 'tidal'
  | 'quora'
  | 'vimeo'
  | 'mixcloud'
  | 'dailymotion'
  | 'behance'
  | 'shazam'
  | 'clubhouse'
  | 'okru'
  | 'coub'
  | 'imdb'
  | 'shopee'
  | 'reverbnation'
  | 'steam'
  | 'trustpilot'
  | 'tripadvisor'
  | 'googlemaps'
  | 'discord'

export type OrderStatus = 'In progress' | 'Completed' | 'Partial' | 'Canceled' | 'Pending'

export type Quality = 'Standard' | 'Premium' | 'Pro'

export interface Service {
  id: string
  platform: Platform
  name: string
  category: string
  rate: number
  min: number
  max: number
  avgTime: string
  quality: Quality
  badge?: string
  description: string
  /** Set on country-targeted services (shown under the country chips, always last). */
  country?: string
  /** Service type used for the dropdown chips (Followers, Likes, Auto Boost ...). */
  ty?: string
  /**
   * How the service is ordered. Left out = link + quantity.
   * package  : fixed bundle at one flat price (rate is the price of the whole package)
   * comments : the buyer types one comment per line, the line count is the quantity
   * list     : the buyer pastes a list (usernames etc.), one per line, the line count is the quantity
   * poll     : link + quantity + the poll answer number
   * auto     : subscription, boosts every new post (username, quantity range, number of posts, delay)
   * note     : link + quantity + a message or instructions
   */
  mode?: 'package' | 'comments' | 'list' | 'poll' | 'auto' | 'note'
  /** Package that needs the buyer's own comment text: exactly this many lines. */
  lines?: number
}

export interface Order {
  id: string
  serviceId: string
  serviceName: string
  platform: Platform
  link: string
  quantity: number
  charge: number
  startCount: number
  status: OrderStatus
  progress: number
  createdAt: string
  dripfeed?: boolean
  mock?: boolean
  bonus?: boolean
}

export interface Transaction {
  id: string
  type: 'deposit' | 'order' | 'refund' | 'adjustment'
  label: string
  amount: number
  createdAt: string
  method?: string
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  snapchat: 'Snapchat',
  spotify: 'Spotify',
  jiosaavn: 'JioSaavn',
  website: 'Website Traffic',
  telegram: 'Telegram',
  x: 'X / Twitter',
  threads: 'Threads',
  whatsapp: 'WhatsApp',
  linkedin: 'LinkedIn',
  twitch: 'Twitch',
  kick: 'Kick',
  soundcloud: 'SoundCloud',
  pinterest: 'Pinterest',
  audiomack: 'Audiomack',
  trovo: 'Trovo',
  vk: 'VK',
  kwai: 'Kwai',
  likee: 'Likee',
  reddit: 'Reddit',
  tumblr: 'Tumblr',
  deezer: 'Deezer',
  tidal: 'Tidal',
  quora: 'Quora',
  vimeo: 'Vimeo',
  mixcloud: 'Mixcloud',
  dailymotion: 'Dailymotion',
  behance: 'Behance',
  shazam: 'Shazam',
  clubhouse: 'Clubhouse',
  okru: 'OK.ru',
  coub: 'Coub',
  imdb: 'IMDb',
  shopee: 'Shopee',
  reverbnation: 'ReverbNation',
  steam: 'Steam',
  trustpilot: 'Trustpilot',
  tripadvisor: 'TripAdvisor',
  googlemaps: 'Google Maps',
  discord: 'Discord',
}

/** Chip order inside a platform dropdown: service types first, country-wise groups always last. */
const TYPE_ORDER = [
  'Followers', 'Subscribers', 'Members', 'Likes', 'Repost', 'Views', 'Live Views', 'Shares', 'Comments',
  'Plays', 'Saves', 'Traffic', 'Watch time', 'Watch hours', 'Reactions', 'Growth',
  'Auto Boost', 'Reviews', 'Mentions', 'Poll Votes', 'Direct Messages', 'Data Scraper', 'Reports', 'Other',
]
const COUNTRY_ORDER = ['USA', 'India', 'UK', 'Arab', 'Saudi Arabia', 'Gulf']
/** Country categories are written with a leading flag emoji, e.g. "🇺🇸 USA". */
export const isCountryCategory = (c: string) => (c.codePointAt(0) ?? 0) > 0x1f000
export const categoryRank = (c: string) => {
  if (isCountryCategory(c)) {
    const i = COUNTRY_ORDER.findIndex((n) => c.endsWith(n))
    return 100 + (i < 0 ? COUNTRY_ORDER.length : i)
  }
  const i = TYPE_ORDER.indexOf(c)
  return i < 0 ? 50 : i
}

/** Three grades of service: Standard (everyday quality), Premium (celebrity grade), Pro (Bollywood grade). */
export const TIERS: Record<Quality, { grade: string; headline: string; blurb: string; perks: string[] }> = {
  Standard: {
    grade: 'Everyday quality',
    headline: 'Reliable boosts for everyday growth',
    blurb: 'Dependable growth for a fresh page, a new upload or a steady push. Good sources, quick starts and honest delivery.',
    perks: ['Quick start on most orders', 'Natural, gradual delivery', 'Great for everyday boosts'],
  },
  Premium: {
    grade: 'Celebrity grade',
    headline: 'The grade serious creators run on',
    blurb: 'Better sources, steadier retention and real refill cover. This is the sweet spot for channels and pages that plan to stay.',
    perks: ['Higher-quality profiles', 'Refill cover on followers', 'India-targeted options'],
  },
  Pro: {
    grade: 'Bollywood grade',
    headline: 'Our top shelf, for launches that cannot slip',
    blurb: 'The strongest sources we offer: lifetime or long refill cover, India-first audiences and the highest retention. Built for stars, brands and big drops.',
    perks: ['Lifetime and long refill cover', 'Highest retention and stability', 'Priority-grade delivery'],
  },
}

export const TIER_ORDER: Quality[] = ['Standard', 'Premium', 'Pro']

/** Provider cost per 1,000 in INR (public rates). The price users see is MARKUP x this. */
const svc = (
  id: string, platform: Platform, category: string, name: string, rate: number, min: number, max: number,
  avgTime: string, quality: Quality, description: string, badge?: string,
): Service => ({ id, platform, category, name, rate, min, max, avgTime, quality, description, badge })

const CURATED: Service[] = [
  // ---------- Instagram ----------
  svc('ig-reel-views', 'instagram', 'Views', 'Reel & Video Views', 0.25, 100, 10000000, '0–30 min', 'Standard',
    'Give every new reel a busy first hour. Views land fast on any public link, so your content looks alive the moment it goes up.'),
  svc('ig-likes', 'instagram', 'Likes', 'Post Likes · Low drop', 4.73, 50, 500000, '0–30 min', 'Standard',
    'Real-looking likes with a low drop rate. Add visible proof to your best posts and keep first-time visitors on your profile a little longer.'),
  svc('ig-followers', 'instagram', 'Followers', 'Followers · 365-day refill', 52.73, 100, 100000, '1–24 hrs', 'Premium',
    'Aged profiles backed by a full year of refill cover. A steady, believable follower count that keeps holding up month after month.', 'Most popular'),
  svc('ig-followers-life', 'instagram', 'Followers', 'Followers · Lifetime refill', 54.55, 100, 100000, '1–24 hrs', 'Pro',
    'The same aged profiles with lifetime refill. Order once and stop worrying about drops for good.', 'Lifetime cover'),
  svc('ig-followers-in', 'instagram', 'Followers', 'Indian Followers · 365-day refill', 87.27, 100, 100000, '1–24 hrs', 'Pro',
    'India-based aged profiles for creators whose brand deals and audience live in India. Our most trusted follower grade.', 'India targeted'),

  // ---------- YouTube ----------
  svc('yt-views', 'youtube', 'Views', 'Views · Real traffic', 8, 100, 10000000, '6–24 hrs', 'Standard',
    'Fast, natural-looking view growth for any public video. A dependable base layer for every new upload.'),
  svc('yt-shorts-views', 'youtube', 'Views', 'Shorts Views', 8, 100, 10000000, '2–6 hrs', 'Standard',
    'Quick starts for Shorts, where the first few hours decide everything. Delivery usually begins within the hour.'),
  svc('yt-views-in', 'youtube', 'Views', 'Indian Views', 10, 100, 10000000, '12–48 hrs', 'Premium',
    'India-targeted views that suit a local audience and keep your analytics believable.'),
  svc('yt-views-sug', 'youtube', 'Views', 'Suggested-Traffic Views', 12, 100, 10000000, '12–48 hrs', 'Premium',
    'Views that mimic discovery from the suggested feed, a pattern the algorithm likes to see.'),
  svc('yt-views-hr', 'youtube', 'Views', 'High-Retention Views · 70%+', 12, 100, 10000000, '12–48 hrs', 'Pro',
    'Watch time that stays above 70%. The strongest signal we offer for videos you want YouTube to push further.', 'Top retention'),
  svc('yt-subs', 'youtube', 'Subscribers', 'Subscribers', 15, 100, 100000, '24–72 hrs', 'Standard',
    'Steady subscriber growth for new channels at a very friendly price.'),
  svc('yt-subs-fast', 'youtube', 'Subscribers', 'Fast Subscribers', 15, 100, 100000, '12–48 hrs', 'Standard',
    'The same grade with a faster start. Great when a launch or a deadline is close.'),
  svc('yt-subs-in', 'youtube', 'Subscribers', 'Indian Subscribers · 30-day refill', 18, 100, 100000, '24–72 hrs', 'Premium',
    'India-based subscribers with refill cover, for a channel that looks local and real.'),
  svc('yt-subs-nodrop', 'youtube', 'Subscribers', 'No-Drop Subscribers · Auto refill', 20, 100, 100000, '24–72 hrs', 'Pro',
    'Our most stable subscriber grade, with automatic refill so counts stay put through channel reviews.', 'No drop'),
  svc('yt-likes', 'youtube', 'Likes', 'Video Likes', 8, 100, 1000000, '2–6 hrs', 'Standard',
    'Balance your views with likes so engagement looks natural.'),
  svc('yt-likes-in', 'youtube', 'Likes', 'Indian Likes', 10, 100, 1000000, '2–6 hrs', 'Premium',
    'India-based likes for local-first channels.'),
  svc('yt-shares', 'youtube', 'Shares', 'Shares', 10, 100, 1000000, '6–24 hrs', 'Standard',
    'Add share counts that make a video look worth passing on.'),
  svc('yt-comments', 'youtube', 'Comments', 'Random Comments', 1000, 10, 5000, '4–12 hrs', 'Premium',
    'Ready-made comments that add life under your video. Billed per comment.'),
  svc('yt-comments-custom', 'youtube', 'Comments', 'Custom Comments', 2000, 10, 5000, '4–12 hrs', 'Pro',
    'You write the lines and we post them. Perfect for on-brand, contextual replies. Billed per comment.'),
  svc('yt-watch-hours', 'youtube', 'Watch hours', 'Watch Hours · Monetisation', 700, 100, 4000, '7–14 days', 'Pro',
    'Spread, high-retention watch hours for creators aiming at the 4,000-hour mark. Order in batches across several videos to keep growth natural. Quantity is in hours.', 'Monetisation'),

  // ---------- Telegram ----------
  svc('tg-members', 'telegram', 'Members', 'Channel Members', 10, 100, 200000, '1–12 hrs', 'Standard',
    "Grow your channel's headcount quickly so new visitors trust it at first glance."),
]

export const MARKUP = 5

/** Referral welcome bonus: free Instagram views on the first qualifying top-up. */
export const BONUS_VIEWS = 50000
export const BONUS_MIN_TOPUP = 100

// Run `npm run sync:services` to replace the curated list with your provider's full catalog.
const SYNCED = synced as unknown as Service[]
const SOURCE = SYNCED.length ? SYNCED : CURATED

const BASE_TEXT: Record<string, string> = {
  Followers: 'Profiles that follow your account, added at a steady pace so growth looks natural.',
  Subscribers: 'Subscribers added gradually to your channel for a believable, steady climb.',
  Members: 'Members joining your channel or group so it looks active from the first visit.',
  Likes: 'Visible likes on your post, added quickly so new visitors see proof right away.',
  Repost: 'Reposts that push your content to more feeds and make it look worth passing on.',
  Views: 'Views on your video or post, so every new upload gets a busy first hour.',
  'Live Views': 'Live viewers for your stream, so it looks busy while it is on air.',
  Shares: 'Share counts that show your content is worth passing on.',
  Comments: 'Comments that add life under your post. Billed per comment.',
  Plays: 'Plays on your track or playlist to lift its numbers and discovery.',
  Saves: 'Saves on your content, a strong signal that it is worth coming back to.',
  Reactions: 'Reactions on your post to boost visible engagement.',
  'Watch time': 'Watch hours for creators aiming at the monetisation mark. Quantity is in hours.',
  Traffic: 'Visitors sent to your website link, delivered gradually over time.',
  Growth: 'A combined growth bundle that lifts several numbers together.',
  'Auto Boost': 'Set it once and every new post you publish is boosted automatically.',
  Reviews: 'Reviews and ratings for your page or listing.',
  Mentions: 'Mentions that put your account in front of more people.',
  'Poll Votes': 'Votes for your poll. Tell us which answer number to vote for.',
  'Direct Messages': 'Direct messages sent to a targeted audience.',
  'Data Scraper': 'Public data collected for you from the link you give.',
  Reports: 'Reports filed on the link you give.',
  Other: 'A specialist service for the link you give.',
}
const MODE_TEXT: Record<string, string> = {
  package: 'A ready-made package at one flat price, so there is no quantity to choose.',
  auto: 'Choose how many new posts to cover and how much each post gets.',
  comments: 'Write your own comments, one per line. You pay per comment.',
  list: 'Paste your list, one entry per line. You pay per entry.',
  poll: 'Tell us which answer number to vote for.',
  note: 'Add a short message or instructions and we take it from there.',
}
/** Plain-English description built from the service itself, so the catalog file stays small. */
const describe = (s: Service): string => {
  if (s.description) return s.description
  const days = s.name.match(/(\d{1,3})-day refill/i)?.[1]
  return [
    s.mode && MODE_TEXT[s.mode] ? MODE_TEXT[s.mode] : BASE_TEXT[s.ty ?? 'Other'],
    /lifetime refill/i.test(s.name) ? 'Backed by lifetime refill cover.' : days ? `Backed by ${days}-day refill cover.` : '',
    /non-drop/i.test(s.name) ? 'Built to hold, with no drop expected.' : /low drop/i.test(s.name) ? 'Low drop rate.' : '',
    s.country ? `Targeted to ${s.country} audiences.` : '',
  ].filter(Boolean).join(' ')
}

/** What users see: provider cost x MARKUP (5x). */
export const SERVICES: Service[] = SOURCE.map((s) => ({
  ...s,
  rate: Math.round(s.rate * MARKUP * 100) / 100,
  description: describe(s),
}))

/** Packages are priced per package; everything else per 1,000. */
export const isPackage = (s: Pick<Service, 'mode'>) => s.mode === 'package'
export const priceOf = (s: Pick<Service, 'mode' | 'rate'>, quantity: number) =>
  isPackage(s) ? s.rate : Math.round(((s.rate * (Number.isFinite(quantity) ? quantity : 0)) / 1000) * 100) / 100

/** Free-views bonus uses the curated reel-views service, or the cheapest Instagram views service of a synced catalog. */
export const BONUS_SERVICE_ID =
  SERVICES.find((x) => x.id === 'ig-reel-views')?.id ??
  [...SERVICES].filter((x) => x.platform === 'instagram' && x.category === 'Views' && !x.country).sort((a, b) => a.rate - b.rate)[0]?.id ??
  'ig-reel-views'

export const CHART_POINTS = [420, 380, 510, 470, 620, 590, 720, 680, 810, 760, 920, 860, 1040, 1180]

export const CHART_LABELS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
]

const hoursAgo = (n: number) => new Date(Date.now() - n * 36e5).toISOString()

export const seedOrders = (): Order[] => [
  {
    id: 'NX-88214',
    serviceId: 'ig-followers',
    serviceName: 'Instagram Followers',
    platform: 'instagram',
    link: 'instagram.com/style.by.ananya',
    quantity: 5000,
    charge: 425,
    startCount: 12480,
    status: 'In progress',
    progress: 64,
    createdAt: hoursAgo(2),
  },
  {
    id: 'NX-88209',
    serviceId: 'yt-views',
    serviceName: 'YouTube Views',
    platform: 'youtube',
    link: 'youtube.com/watch?v=vlog042',
    quantity: 25000,
    charge: 3500,
    startCount: 184200,
    status: 'Completed',
    progress: 100,
    createdAt: hoursAgo(9),
  },
  {
    id: 'NX-88196',
    serviceId: 'tg-members',
    serviceName: 'Telegram Channel Members',
    platform: 'telegram',
    link: 't.me/ugrowsmmdeals',
    quantity: 2000,
    charge: 360,
    startCount: 6600,
    status: 'In progress',
    progress: 38,
    createdAt: hoursAgo(26),
  },
  {
    id: 'NX-88188',
    serviceId: 'ig-reel-views',
    serviceName: 'Instagram Reels Views',
    platform: 'instagram',
    link: 'instagram.com/reel/Cx92ka',
    quantity: 100000,
    charge: 800,
    startCount: 0,
    status: 'Completed',
    progress: 100,
    createdAt: hoursAgo(31),
  },
  {
    id: 'NX-88175',
    serviceId: 'x-followers',
    serviceName: 'X Followers',
    platform: 'x',
    link: 'x.com/arjunbuilds',
    quantity: 1000,
    charge: 320,
    startCount: 842,
    status: 'Canceled',
    progress: 0,
    createdAt: hoursAgo(48),
  },
  {
    id: 'NX-88160',
    serviceId: 'sp-plays',
    serviceName: 'Spotify Plays',
    platform: 'spotify',
    link: 'open.spotify.com/track/4fLw9',
    quantity: 20000,
    charge: 1200,
    startCount: 0,
    status: 'Completed',
    progress: 100,
    createdAt: hoursAgo(66),
  },
  {
    id: 'NX-88152',
    serviceId: 'fb-page-likes',
    serviceName: 'Facebook Page Likes',
    platform: 'facebook',
    link: 'facebook.com/ugrowsmmstudio',
    quantity: 1500,
    charge: 315,
    startCount: 2900,
    status: 'In progress',
    progress: 91,
    createdAt: hoursAgo(72),
  },
]

export const seedTransactions = (): Transaction[] => [
  { id: 'TX-5521', type: 'deposit', label: 'Wallet top-up', amount: 5000, createdAt: hoursAgo(70), method: 'UPI' },
  { id: 'TX-5518', type: 'order', label: 'Instagram Followers · 5,000', amount: 425, createdAt: hoursAgo(2) },
  { id: 'TX-5512', type: 'order', label: 'YouTube Views · 25,000', amount: 3500, createdAt: hoursAgo(9) },
  { id: 'TX-5501', type: 'refund', label: 'Refund · X Followers #NX-88175', amount: 320, createdAt: hoursAgo(41) },
  { id: 'TX-5490', type: 'order', label: 'Spotify Plays · 20,000', amount: 1200, createdAt: hoursAgo(66) },
  { id: 'TX-5462', type: 'deposit', label: 'Wallet top-up', amount: 2500, createdAt: hoursAgo(120), method: 'Visa' },
]

export const formatINR = (value: number, decimals = 2) =>
  '₹' +
  value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

/** Starting prices: show paise when the rate is under ₹10 and not a whole number (₹1.25, not ₹1). */
export const formatFrom = (v: number) => formatINR(v, v < 10 && !Number.isInteger(v) ? 2 : 0)

export const formatCompact = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`
  return value.toString()
}

export const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
