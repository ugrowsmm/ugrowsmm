import { Link } from 'react-router-dom'
import { ArrowRight, Check, Eye, Gift, Heart, Play } from 'lucide-react'
import { BONUS_MIN_TOPUP, BONUS_VIEWS } from '../lib/data'

/**
 * Promo for the referral welcome bonus: 50,000 free Instagram views on the first ₹100 top-up.
 * Used on Home (with a button), Referral and Add funds (with their own note).
 */
export default function BonusBanner({ cta = false, note }: { cta?: boolean; note?: string }) {
  const views = BONUS_VIEWS.toLocaleString('en-IN')
  return (
    <section className="bb" aria-label={`${views} free Instagram views offer`}>
      <div className="bb-main">
        <span className="bb-pill"><Gift size={13} /> Welcome gift</span>

        <h3 className="bb-title">
          <span className="bb-num">{views}</span>
          <span className="bb-free">FREE</span>
          <span className="bb-what">Instagram views</span>
        </h3>

        <p className="bb-text">
          {note ??
            `Join with any creator's code and make your first ₹${BONUS_MIN_TOPUP} top-up. Your ${views} Instagram views unlock instantly, completely free.`}
        </p>

        <ul className="bb-chips">
          <li><Check size={13} /> On your first ₹{BONUS_MIN_TOPUP} top-up</li>
          <li><Check size={13} /> Unlocks instantly</li>
          <li><Check size={13} /> Works with any creator code</li>
        </ul>

        {cta ? (
          <Link to="/login" className="bb-cta">
            Claim my free views <ArrowRight size={18} />
          </Link>
        ) : null}
      </div>

      <div className="bb-art" aria-hidden="true">
        <span className="bb-card"><Eye size={52} strokeWidth={1.8} /></span>
        <span className="bb-float f1"><Heart size={13} fill="currentColor" /> Likes</span>
        <span className="bb-float f2"><Play size={13} fill="currentColor" /> Reels</span>
        <span className="bb-float f3">+{BONUS_VIEWS / 1000}K</span>
      </div>
    </section>
  )
}
