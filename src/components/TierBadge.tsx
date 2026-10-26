import { Crown, Star } from 'lucide-react'
import type { Quality } from '../lib/data'

const CLS: Record<Quality, string> = { Standard: 'std', Premium: 'pre', Pro: 'pro' }

/** Standard = grey star, Premium = orange star, Pro = gold crown. Same look on phone and desktop. */
export default function TierBadge({ quality, large = false }: { quality: Quality; large?: boolean }) {
  const Icon = quality === 'Pro' ? Crown : Star
  return (
    <span className={`tier-badge ${CLS[quality]} ${large ? 'lg' : ''}`}>
      <Icon size={large ? 15 : 12} fill={quality === 'Standard' ? 'none' : 'currentColor'} aria-hidden="true" />
      {quality}
    </span>
  )
}
