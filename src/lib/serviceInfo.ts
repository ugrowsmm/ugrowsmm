import type { Platform, Service } from './data'

/**
 * Everything the product-style service sheet needs, derived from the service itself.
 * Works for the curated list AND for anything pulled in by `npm run sync:services`,
 * so a newly added service looks identical everywhere without extra work.
 */

export interface Refill {
  label: string
  /** good = strong cover, ok = some cover, none = no cover */
  tone: 'good' | 'ok' | 'none'
  detail: string
}

export function refillOf(s: Pick<Service, 'name' | 'category' | 'description'>): Refill {
  const text = `${s.name} ${s.description}`
  if (/lifetime/i.test(text)) {
    return { label: 'Lifetime', tone: 'good', detail: 'If the count drops, it is refilled for as long as the order exists.' }
  }
  const days = text.match(/(\d{1,3})\s*[- ]?\s*day\s*(?:auto\s*)?refill/i)
  if (days) {
    return { label: `${days[1]} days`, tone: 'ok', detail: `Any drop in the first ${days[1]} days is refilled.` }
  }
  if (/non?[- ]?drop|auto[- ]?refill/i.test(text)) {
    return { label: 'Auto refill', tone: 'good', detail: 'Refill runs automatically, no ticket needed.' }
  }
  if (/low drop/i.test(text)) {
    return { label: 'Low drop rate', tone: 'ok', detail: 'Built to hold steady, with a low drop rate.' }
  }
  return { label: 'Not included', tone: 'none', detail: 'Delivered as a one-time boost with no refill cover.' }
}

type Kind = 'profile' | 'post'

const PROFILE_WORDS = /follower|subscriber|member|page like|fan|channel|traffic/i

export function linkKind(s: Pick<Service, 'category' | 'name'>): Kind {
  return PROFILE_WORDS.test(`${s.category} ${s.name}`) && !/video|post|reel|short/i.test(s.name) ? 'profile' : 'post'
}

const PLACEHOLDER: Partial<Record<Platform, { profile: string; post: string }>> = {
  instagram: { profile: 'https://instagram.com/your.username', post: 'https://instagram.com/reel/XXXXXXXX' },
  youtube: { profile: 'https://youtube.com/@yourchannel', post: 'https://youtube.com/watch?v=XXXXXXXX' },
  x: { profile: 'https://x.com/yourusername', post: 'https://x.com/user/status/123456' },
  facebook: { profile: 'https://facebook.com/yourpage', post: 'https://facebook.com/yourpage/posts/123456' },
  telegram: { profile: 'https://t.me/yourchannel', post: 'https://t.me/yourchannel/123' },
  spotify: { profile: 'https://open.spotify.com/artist/XXXX', post: 'https://open.spotify.com/track/XXXX' },
  snapchat: { profile: 'your_snapchat_username', post: 'https://snapchat.com/spotlight/XXXX' },
  jiosaavn: { profile: 'https://www.jiosaavn.com/artist/XXXX', post: 'https://www.jiosaavn.com/song/XXXX' },
  website: { profile: 'https://yourwebsite.com', post: 'https://yourwebsite.com/page' },
  threads: { profile: 'https://threads.net/@yourusername', post: 'https://threads.net/@user/post/XXXX' },
  whatsapp: { profile: 'https://whatsapp.com/channel/XXXX', post: 'https://whatsapp.com/channel/XXXX' },
  linkedin: { profile: 'https://linkedin.com/in/yourname', post: 'https://linkedin.com/posts/XXXX' },
  twitch: { profile: 'https://twitch.tv/yourchannel', post: 'https://twitch.tv/videos/XXXX' },
  kick: { profile: 'https://kick.com/yourchannel', post: 'https://kick.com/yourchannel' },
  soundcloud: { profile: 'https://soundcloud.com/yourname', post: 'https://soundcloud.com/yourname/track' },
  pinterest: { profile: 'https://pinterest.com/yourname', post: 'https://pinterest.com/pin/XXXX' },
}
const FALLBACK_LINK = { profile: 'https://example.com/your-profile', post: 'https://example.com/your-post' }

export function linkGuide(s: Service): { need: string; placeholder: string } {
  const kind = linkKind(s)
  const placeholder = (PLACEHOLDER[s.platform] ?? FALLBACK_LINK)[kind]
  const need =
    s.platform === 'telegram'
      ? 'Public channel or group link'
      : kind === 'profile'
        ? s.platform === 'youtube'
          ? 'Channel link'
          : s.platform === 'facebook'
            ? 'Page link'
            : 'Profile link'
        : s.platform === 'youtube'
          ? 'Video or Shorts link'
          : 'Post or reel link'
  return { need, placeholder }
}

/** Short, honest tips shown in the "Good to know" box. Edit freely. */
export function goodToKnow(s: Service): string[] {
  const kind = linkKind(s)
  const tips = [
    kind === 'profile'
      ? 'Keep the account public while the order runs. Private accounts cannot receive growth.'
      : 'The post or video must be public. Private or deleted links cannot be delivered.',
    kind === 'profile'
      ? 'Do not change your username during delivery, or the order may stall.'
      : 'Copy the link straight from the app so it opens the exact post.',
    'Wait for an order to finish before placing another one on the same link.',
  ]
  if (/comment/i.test(s.category)) tips[2] = 'Comments are billed per comment, so the quantity is the number of comments.'
  if (/watch/i.test(s.category)) tips[2] = 'Quantity is in hours. Spread large targets across several videos for natural growth.'
  return tips
}
