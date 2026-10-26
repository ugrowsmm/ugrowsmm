import { useEffect, useRef } from 'react'
import { BadgeCheck, Star } from 'lucide-react'
import { REVIEWS, SAMPLE_REVIEWS, type Review } from '../lib/reviews'

const initials = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('')

function Card({ r }: { r: Review }) {
  return (
    <article className="rv-card">
      <div className="between">
        <span className={`rv-badge ${SAMPLE_REVIEWS ? 'sample' : ''}`}>
          <BadgeCheck size={12} /> {SAMPLE_REVIEWS ? 'Sample review' : 'Verified review'}
        </span>
        <span className="rv-when">{r.when}</span>
      </div>
      <div className="rv-stars" aria-label="5 out of 5 stars">
        {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={18} fill="currentColor" />)}
      </div>
      <p className="rv-text">“{r.text}”</p>
      <div className="rv-by">
        <span className="rv-av">{initials(r.name)}</span>
        <div>
          <b>{r.name} <i className="rv-dot" /></b>
          <span>{r.role}</span>
        </div>
      </div>
    </article>
  )
}

/** One row of review cards that glides left. Pauses on hover; static scroll if motion is reduced. */
const SHOWN = REVIEWS.slice(0, 10) // the loop is the same cards twice: fewer cards = a much lighter layer to animate

export default function ReviewsMarquee() {
  const track = useRef<HTMLDivElement>(null)

  // the loop only runs while the row is on screen, so it never costs anything during the rest of the page
  useEffect(() => {
    const el = track.current
    if (!el || !('IntersectionObserver' in window)) return
    el.classList.add('paused')
    const io = new IntersectionObserver(([entry]) => {
      el.classList.toggle('paused', !entry.isIntersecting)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="rv-wrap">
      <div className="rv-row">
        <div className="rv-track" ref={track}>
          {[...SHOWN, ...SHOWN].map((r, j) => (
            <div key={`${r.name}-${j}`} aria-hidden={j >= SHOWN.length ? true : undefined}>
              <Card r={r} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
