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
    case 'tiktok':
      return (
        <svg {...common}>
          <path d="M14.5 3v10.6a3.9 3.9 0 1 1-3.4-3.87" />
          <path d="M14.5 5.2A5.6 5.6 0 0 0 20 9.6V6.4a5.6 5.6 0 0 1-5.5-3.4z" />
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
  }
}
