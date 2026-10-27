import type { Platform } from '../lib/data'

export function PlatformIcon({ platform, size = 18 }: { platform: Platform; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (platform) {
    case 'instagram':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'youtube':
      return (
        <svg {...common}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
          <path d="M10.4 9.4l4.7 2.6-4.7 2.6z" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'x':
      return (
        <svg {...common}>
          <path d="M4 3.5l7.1 8.7L4.4 20.5h2.6l5.4-6.5 5.3 6.5h2.7l-7.4-9.1 6.4-7.9h-2.6l-4.9 6-5-6z" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'facebook':
      return (
        <svg {...common}>
          <path d="M14.5 8.5V6.8c0-.9.3-1.3 1.4-1.3H17V2.6h-2.3c-2.6 0-4 1.4-4 3.9v2h-2v3h2V21h4v-9.5h2.9l.4-3z" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'telegram':
      return (
        <svg {...common}>
          <path d="M21 4.3L2.9 11.2c-1 .4-1 1 0 1.3l4.5 1.4 1.7 5.3c.2.6.4.7 1 .3l2.5-1.9 4.7 3.5c.9.5 1.4.2 1.6-.8L21.9 5.5c.2-1-.4-1.5-1-1.2z" />
          <path d="M7.5 13.8L18.6 6.9l-8.5 7.9-.4 3.6" />
        </svg>
      )
    case 'spotify':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M7.4 9.3c3.2-.8 6.5-.5 9.2.9M8 12.4c2.6-.6 5.2-.3 7.6.8M8.7 15.4c2-.4 4-.2 5.8.7" />
        </svg>
      )
    case 'snapchat':
      return (
        <svg {...common}>
          <path d="M12 3.5c-2.6 0-4.3 2-4.3 4.6v2.1c-.6.2-1.4.2-2.2.2.5.9 1.4 1.3 2.2 1.5-.4 1.6-1.5 2.6-3 3.1 1 .5 2 .5 2.9.9.3.4.2 1 .8 1.2 1.2.1 1.6-.5 3.6-.5s2.4.6 3.6.5c.6-.2.5-.8.8-1.2.9-.4 1.9-.4 2.9-.9-1.5-.5-2.6-1.5-3-3.1.8-.2 1.7-.6 2.2-1.5-.8 0-1.6 0-2.2-.2V8.1c0-2.6-1.7-4.6-4.3-4.6z" />
        </svg>
      )
    case 'jiosaavn':
      return (
        <svg {...common}>
          <path d="M9 17.5V6.2l9-2v11.3" />
          <circle cx="6.8" cy="17.5" r="2.2" />
          <circle cx="15.8" cy="15.5" r="2.2" />
        </svg>
      )
    case 'website':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z" />
        </svg>
      )
    case 'threads':
      return (
        <svg {...common}>
          <path d="M16.5 8.6C15.9 6.4 14.3 5 12 5 8.7 5 6.5 7.6 6.5 12s2.2 7 5.5 7c2.8 0 4.5-1.6 4.5-3.6 0-2.4-2.1-3.5-4.5-3.5-1.7 0-2.8.8-2.8 1.9 0 1 .9 1.7 2.1 1.7 2 0 3.2-1.5 3.2-4" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg {...common}>
          <path d="M4 20l1.2-4.2A8 8 0 1 1 8.3 18.9L4 20z" />
          <path d="M9.2 8.8c.3 2.6 2.4 4.9 5.2 5.6l1-1.2-1.8-.9-.8.6c-1-.4-1.8-1.2-2.2-2.2l.6-.8-.9-1.8-1.1 1.3z" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
          <path d="M8 10.5V16M8 7.8v.1M11.5 16v-5.5M11.5 12.6c0-1.3.9-2.2 2.2-2.2s2.1.9 2.1 2.2V16" />
        </svg>
      )
    case 'twitch':
      return (
        <svg {...common}>
          <path d="M5 3.5h14v10l-4 4h-3.5L9 20v-2.5H5z" />
          <path d="M15 7.5v3.5M11 7.5v3.5" />
        </svg>
      )
    case 'kick':
      return (
        <svg {...common}>
          <path d="M6 4v16M6 12l7-8M8.5 10l5.5 10" />
        </svg>
      )
    case 'soundcloud':
      return (
        <svg {...common}>
          <path d="M3.5 15v-3M6.5 16V10M9.5 16V8.5M12.5 16V7.5c4-1 7.5 1.2 7.5 4.5a3.5 3.5 0 0 1-3.5 4h-4" />
        </svg>
      )
    case 'pinterest':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M11 16.5l1.6-6.6M9.4 11.8c-.5-2.4 1.2-4 3.2-3.8 2.2.2 3.1 2.2 2.4 4.1-.6 1.6-2 2.2-3 1.7" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z" />
        </svg>
      )
  }
}
