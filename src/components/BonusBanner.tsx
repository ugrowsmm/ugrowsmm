import { Link } from 'react-router-dom'
import { ArrowRight, Eye, Gift } from 'lucide-react'
import { BONUS_MIN_TOPUP, BONUS_VIEWS } from '../lib/data'

/** Promo for the referral welcome bonus: 50,000 free Instagram views on the first ₹100 top-up. */
export default function BonusBanner({ cta = false, note }: { cta?: boolean; note?: string }) {
  return (
    <div className="bonus-banner">
      <div className="bonus-badge" aria-hidden="true">
        <Eye size={18} />
        <b>{BONUS_VIEWS / 1000}K</b>
        <span>FREE</span>
      </div>
      <div className="grow">
        <div className="bonus-title">
          <Gift className="bonus-gift" /> Join with a creator&apos;s code, get {BONUS_VIEWS.toLocaleString('en-IN')} free Instagram views
        </div>
        <p className="bonus-text">
          {note ?? `Sign up using any referral code and add ₹${BONUS_MIN_TOPUP} to your wallet. Your first top-up unlocks ${BONUS_VIEWS.toLocaleString('en-IN')} Instagram views, completely free.`}
        </p>
      </div>
      {cta ? (
        <Link to="/login" className="btn btn-primary">
          Get started <ArrowRight />
        </Link>
      ) : null}
    </div>
  )
}
