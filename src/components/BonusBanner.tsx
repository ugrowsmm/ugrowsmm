import { Link } from 'react-router-dom'
import { ArrowRight, Eye, Gift, Heart, Send, Users, Wallet, Zap } from 'lucide-react'
import { BONUS_MIN_TOPUP, BONUS_VIEWS } from '../lib/data'
import { PlatformIcon } from './PlatformIcon'

type Variant = 'user' | 'creator'

/**
 * Promo for the referral welcome bonus: 50,000 free Instagram views on the first ₹100 top-up.
 * - variant "user"    → shown to people joining (Home, Add funds)
 * - variant "creator" → shown to creators on the Referral page
 */
export default function BonusBanner({
  variant = 'user',
  cta = false,
  note,
  footnote,
}: {
  variant?: Variant
  cta?: boolean
  note?: string
  footnote?: string
}) {
  const views = BONUS_VIEWS.toLocaleString('en-IN')
  const creator = variant === 'creator'

  const text =
    note ??
    (creator
      ? `Use a creator code on your first ₹${BONUS_MIN_TOPUP} top-up to unlock ${views} free views. Earn referral rewards on every top-up your audience makes.`
      : `Join with any creator's code and make your first ₹${BONUS_MIN_TOPUP} top-up. Your ${views} Instagram views unlock instantly, completely free.`)

  const features = creator
    ? [
        { icon: <Eye size={20} />, tone: 'o', label: `${BONUS_VIEWS / 1000}K free views` },
        { icon: <Wallet size={20} />, tone: 'b', label: `First ₹${BONUS_MIN_TOPUP} top-up` },
        { icon: <Users size={20} />, tone: 'p', label: 'Earn on every top-up' },
      ]
    : [
        { icon: <Eye size={20} />, tone: 'o', label: `${BONUS_VIEWS / 1000}K free views` },
        { icon: <Wallet size={20} />, tone: 'b', label: `First ₹${BONUS_MIN_TOPUP} top-up` },
        { icon: <Zap size={20} />, tone: 'p', label: 'Unlocks instantly' },
      ]

  return (
    <section className={`bb bb-${variant}`} aria-label={`${views} free Instagram views offer`}>
      <div className="bb-main">
        <span className="bb-pill">
          {creator ? <Users size={14} /> : <Gift size={14} />}
          {creator ? 'Creator referral' : 'Welcome gift'}
        </span>

        <h3 className="bb-title">
          <span>Get <span className="bb-num">{views}</span></span>
          <span>Free Instagram Views</span>
        </h3>

        <p className="bb-text">{text}</p>

        <ul className="bb-feats">
          {features.map((f) => (
            <li key={f.label}>
              <span className={`bb-ico ${f.tone}`}>{f.icon}</span>
              <span>{f.label}</span>
            </li>
          ))}
        </ul>

        {cta ? (
          <Link to="/login" className="bb-cta">
            Claim my free views <ArrowRight size={18} />
          </Link>
        ) : null}
      </div>

      <div className="bb-art" aria-hidden="true">
        <span className="bb-blob" />
        <span className="bb-dot d1" />
        <span className="bb-dot d2" />

        <div className="bb-phone">
          <span className="bb-notch" />
          <div className="bb-ph-head">
            <span className="bb-ig-word">Instagram</span>
            <span className="bb-ph-more">•••</span>
          </div>
          <div className="bb-ph-user">
            <span className="bb-ph-avatar" />
            <b>your_account</b>
          </div>
          <div className="bb-ph-photo">
            <svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="bbSky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#8ec5ff" />
                  <stop offset=".55" stopColor="#ffd9a8" />
                  <stop offset="1" stopColor="#ffb15c" />
                </linearGradient>
                <radialGradient id="bbSun" cx=".5" cy=".5" r=".5">
                  <stop offset="0" stopColor="#fff7d6" />
                  <stop offset="1" stopColor="#fff7d6" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="200" height="150" fill="url(#bbSky)" />
              <circle cx="128" cy="62" r="46" fill="url(#bbSun)" />
              <path d="M0 92 L38 58 L66 84 L98 50 L140 88 L170 66 L200 90 V150 H0Z" fill="#6f8aa8" opacity=".55" />
              <path d="M0 110 L44 80 L84 108 L124 78 L168 106 L200 92 V150 H0Z" fill="#3f6b5a" opacity=".85" />
              <path d="M0 150 V124 Q50 108 96 122 T200 116 V150Z" fill="#244a3c" />
              <path d="M70 150 Q78 116 100 112 Q122 116 130 150Z" fill="#5b4a3c" />
              <circle cx="100" cy="100" r="7" fill="#1d2a36" />
              <path d="M90 126 Q92 108 100 106 Q109 108 111 126Z" fill="#1d2a36" />
            </svg>
          </div>
          <div className="bb-ph-actions">
            <Heart size={16} fill="#ef4444" color="#ef4444" />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3 20.5l1.6-5.4A8.5 8.5 0 1 1 21 11.5z" /></svg>
            <Send size={16} />
            <svg className="bb-ph-save" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v18l-6-4.5L6 21z" /></svg>
          </div>
          <b className="bb-ph-likes">1.2K likes</b>
          <span className="bb-ph-line" />
          <span className="bb-ph-line short" />
          <div className="bb-ph-nav">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 3 10.5V21h6v-6h6v6h6V10.5z" /></svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M12 8v8M8 12h8" /></svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M3.5 9h17M9 3.5 11 9M15 3.5 17 9" /></svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" /></svg>
          </div>
        </div>

        <span className="bb-views">
          <Eye size={34} strokeWidth={2.4} />
          <span><b>{views}</b><small>VIEWS</small></span>
        </span>
        <span className="bb-spark s1" /><span className="bb-spark s2" /><span className="bb-spark s3" />

        <span className="bb-chip">
          {creator ? <Gift size={20} /> : <Zap size={20} />}
          {creator ? 'Referral rewards' : 'Free on first top-up'}
          <ArrowRight size={15} />
        </span>

        <span className="bb-igicon"><PlatformIcon platform="instagram" size={34} /></span>
      </div>

      {footnote ? (
        <p className="bb-foot">
          <Users size={16} />
          <span>{footnote}</span>
        </p>
      ) : null}
    </section>
  )
}
