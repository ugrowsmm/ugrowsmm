import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { initSmoothScroll, scrollToTop } from '../lib/smoothScroll'

export function SmoothScroll() {
  useEffect(() => initSmoothScroll(), [])
  return null
}

export function ScrollManager() {
  const { pathname } = useLocation()
  useEffect(() => {
    scrollToTop(true)
  }, [pathname])
  return null
}

export function ScrollProgress() {
  const { pathname } = useLocation()
  const barRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    let max = 1
    const measure = () => {
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const header = document.querySelector('.topbar, .mkt-header, .legal-topbar')
      if (barRef.current) barRef.current.style.top = `${header ? Math.round(header.getBoundingClientRect().height) : 0}px`
    }
    const paint = () => {
      raf = 0
      const p = Math.min(1, Math.max(0, window.scrollY / max))
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }
    const remeasure = () => {
      measure()
      paint()
    }
    remeasure()
    const t = window.setTimeout(remeasure, 350) // after the lazy page has painted
    const ro = new ResizeObserver(remeasure)
    ro.observe(document.body)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', remeasure)
    return () => {
      window.clearTimeout(t)
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', remeasure)
    }
  }, [pathname])

  return (
    <div ref={barRef} className="scroll-progress" aria-hidden="true">
      <span ref={fillRef} />
    </div>
  )
}

/* ------------------------------------------------------------------ *
 *  Scroll-to-reveal
 *  Blocks fade + rise into place the first time they scroll into view.
 *  Elements are tagged with a data attribute (never a class), so React
 *  re-renders can not wipe the state. Everything stays CSS-only while
 *  animating (opacity + transform = GPU), and the tag is dropped when the
 *  animation ends so hover effects keep working normally.
 *
 *  data-rv = 0 hidden, waiting | 1 animating | x done / not animated
 * ------------------------------------------------------------------ */
const RULES: [kind: string, selector: string][] = [
  ['head', '.page-head, .mkt-head, .pro-h2, .tier-section-head'],
  ['hero', '.mkt-hero-copy'],
  ['art', '.mkt-hero-art'],
  ['pro', '.pro-hero'],
  [
    'up',
    [
      '.page .card',
      '.page .stat',
      '.page .bb',
      '.page .bonus-banner',
      '.page .tier-card',
      '.page .ts-card',
      '.page .cg-tab',
      '.page .cg-story',
      '.page .service-card',
      '.page .order-card',
      '.page .pro-ref',
      '.page .info-box',
      '.mkt-feature',
      '.mkt-step',
      '.mkt-num',
      '.mkt-faq-item',
      '.mkt-final-inner',
      '.mkt-platforms',
      '.mkt-trustbar',
      '.mkt-section .bb',
      '.pro-calc',
      '.pro-benefit',
      '.pro-table',
      '.pro-plan',
      '.pro-steps li',
      '.pro-help',
    ].join(', '),
  ],
]

const ALL = RULES.map(([, s]) => s).join(', ')
// Never animate anything that is fixed to the screen, lives in a popup, or scrolls sideways on its own.
const SKIP =
  '.overlay, .modal, .drawer, .popover, .toasts, .topbar, .sidebar, .bottom-nav, .mkt-header, .legal-topbar, .scroll-progress, .rv-track, .ug-loader, [data-no-reveal]'

export function RevealManager() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || !('IntersectionObserver' in window)) return

    const root = document.documentElement
    root.classList.add('rv-on')

    const finish = (el: HTMLElement) => {
      el.setAttribute('data-rv', 'x')
      el.style.removeProperty('--rv-d')
    }

    const play = (el: HTMLElement, delay: number) => {
      el.style.setProperty('--rv-d', `${delay}ms`)
      const onEnd = (e: AnimationEvent) => {
        if (e.target !== el) return
        el.removeEventListener('animationend', onEnd)
        finish(el)
      }
      el.addEventListener('animationend', onEnd)
      el.setAttribute('data-rv', '1')
      // safety net: if the animation never fires (tab hidden, display:none), do not leave it half-way
      window.setTimeout(() => {
        if (el.getAttribute('data-rv') === '1') {
          el.removeEventListener('animationend', onEnd)
          finish(el)
        }
      }, 2600)
    }

    const io = new IntersectionObserver(
      (entries) => {
        const showing: IntersectionObserverEntry[] = []
        for (const entry of entries) {
          const el = entry.target as HTMLElement
          if (!el.isConnected) {
            io.unobserve(el)
            continue
          }
          if (el.getAttribute('data-rv') !== '0') {
            io.unobserve(el)
            continue
          }
          if (entry.isIntersecting) showing.push(entry)
          else if (entry.boundingClientRect.top < 0) {
            // scrolled past very quickly (or jumped by a link): show it without animation
            finish(el)
            io.unobserve(el)
          }
        }
        // reading order (top to bottom, then left to right) with a gentle stagger
        showing.sort(
          (a, b) =>
            Math.round(a.boundingClientRect.top / 40) - Math.round(b.boundingClientRect.top / 40) ||
            a.boundingClientRect.left - b.boundingClientRect.left,
        )
        showing.forEach((entry, i) => {
          const el = entry.target as HTMLElement
          io.unobserve(el)
          play(el, Math.min(i, 6) * 75)
        })
      },
      { threshold: 0, rootMargin: '0px 0px -7% 0px' },
    )

    let raf = 0
    const scan = () => {
      raf = 0
      const found = Array.from(document.querySelectorAll<HTMLElement>(ALL)).filter(
        (el) => !el.hasAttribute('data-rv'),
      )
      if (!found.length) return

      // 1) reads only
      const info = found.map((el) => {
        const skip = !!el.closest(SKIP)
        let fixed = false
        if (!skip) {
          const pos = getComputedStyle(el).position
          fixed = pos === 'fixed' || pos === 'sticky'
        }
        const kind = RULES.find(([, sel]) => el.matches(sel))?.[0] ?? 'up'
        return { el, skip: skip || fixed, kind, bottom: el.getBoundingClientRect().bottom }
      })

      // 2) writes only
      for (const { el, skip, kind, bottom } of info) {
        const inside = el.parentElement?.closest('[data-rv]')
        if (skip || inside || bottom < 0) {
          el.setAttribute('data-rv', 'x')
          continue
        }
        el.setAttribute('data-rv-k', kind)
        el.setAttribute('data-rv', '0')
        io.observe(el)
      }
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(scan)
    }

    const mo = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.addedNodes.length)) schedule()
    })
    const rootEl = document.getElementById('root') ?? document.body
    mo.observe(rootEl, { childList: true, subtree: true })
    schedule()

    return () => {
      mo.disconnect()
      io.disconnect()
      if (raf) cancelAnimationFrame(raf)
      root.classList.remove('rv-on')
      document.querySelectorAll<HTMLElement>('[data-rv]').forEach((el) => {
        el.removeAttribute('data-rv')
        el.removeAttribute('data-rv-k')
        el.style.removeProperty('--rv-d')
      })
    }
  }, [])

  return null
}
