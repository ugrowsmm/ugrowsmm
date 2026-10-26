import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Crown, Star } from 'lucide-react'
import {
  PLATFORM_LABEL,
  SERVICES,
  TIERS,
  TIER_ORDER,
  formatFrom,
  type Platform,
  type Quality,
} from '../lib/data'
import { PlatformIcon } from './PlatformIcon'
import { useStore } from '../lib/store'

const CLS: Record<Quality, string> = { Standard: 'std', Premium: 'pre', Pro: 'pro' }

/**
 * The three service grades for the landing page. Starting prices, service count and platforms are all
 * calculated from SERVICES, so adding or removing a service updates this section on its own.
 * A grade with no services is hidden.
 */
export default function TierShowcase() {
  const { state } = useStore()
  const to = state.signedIn ? '/services' : '/login'

  const tiers = useMemo(
    () =>
      TIER_ORDER.map((t) => {
        const list = SERVICES.filter((s) => s.quality === t)
        const platforms = Array.from(new Set(list.map((s) => s.platform))) as Platform[]
        return { t, count: list.length, platforms, from: list.length ? Math.min(...list.map((s) => s.rate)) : 0 }
      }).filter((x) => x.count > 0),
    [],
  )

  return (
    <div className="ts-grid">
      {tiers.map(({ t, count, platforms, from }) => {
        const Icon = t === 'Pro' ? Crown : Star
        const info = TIERS[t]
        return (
          <Link key={t} to={to} className={`ts-card ${CLS[t]}`}>
            {t === 'Premium' ? <span className="ts-flag">Recommended</span> : null}

            <span className="ts-ic">
              <Icon fill={t === 'Standard' ? 'none' : 'currentColor'} aria-hidden="true" />
            </span>
            <span className="ts-name">{t}</span>
            <span className="ts-grade">{info.grade}</span>
            <p className="ts-headline">{info.headline}</p>

            <ul className="ts-perks">
              {info.perks.map((p) => (
                <li key={p}>
                  <Check size={15} /> {p}
                </li>
              ))}
            </ul>

            <div className="ts-price">
              <span className="ts-from-label">Starting from</span>
              <span className="ts-from">
                {formatFrom(from)}
                <small>/1K</small>
              </span>
              <div className="ts-meta">
                <span>
                  {count} {count === 1 ? 'service' : 'services'}
                </span>
                <span className="ts-plats">
                  {platforms.map((p) => (
                    <i key={p} title={PLATFORM_LABEL[p]}>
                      <PlatformIcon platform={p} size={13} />
                    </i>
                  ))}
                </span>
              </div>
            </div>

            <span className="ts-cta">
              Browse {t} <ArrowRight size={16} />
            </span>
          </Link>
        )
      })}
    </div>
  )
}
