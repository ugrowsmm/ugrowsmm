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
