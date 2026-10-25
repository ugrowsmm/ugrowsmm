import Lenis from 'lenis'

let lenis: Lenis | null = null

export function initSmoothScroll() {
  if (lenis || typeof window === 'undefined') return () => {}

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  if (reduced || !finePointer) return () => {}

  const instance = new Lenis({
    lerp: 0.11,
    wheelMultiplier: 1.05,
    smoothWheel: true,
    syncTouch: false,
    autoRaf: true,
    // Let scrollable panels (service picker, legal index) scroll natively while
    // the rest of the page keeps Lenis smoothing.
    allowNestedScroll: true,
  })
  lenis = instance

  const syncLock = () => {
    if (document.body.style.overflow === 'hidden') instance.stop()
    else instance.start()
  }
  const observer = new MutationObserver(syncLock)
  observer.observe(document.body, { attributes: true, attributeFilter: ['style'] })

  return () => {
    observer.disconnect()
    instance.destroy()
    lenis = null
  }
}

export function scrollToTop(immediate = true) {
  if (lenis) {
    lenis.scrollTo(0, immediate ? { immediate: true } : { duration: 1.1 })
    return
  }
  window.scrollTo({ top: 0, behavior: immediate ? 'auto' : 'smooth' })
}

// Section anchors carry `scroll-margin-top: 96px`, which Lenis also honours, so
// the offset is applied exactly once and the sticky headers never cover a heading.
export function scrollToSection(target: string | HTMLElement) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.1 })
    return
  }
  const element =
    typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (!element) return
  const top = element.getBoundingClientRect().top + window.scrollY - 96
  window.scrollTo({ top, behavior: 'smooth' })
}
