import Lenis from 'lenis'

let lenis: Lenis | null = null

// Long, soft tail (expo-out): the page glides in and settles gently instead of stopping abruptly.
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

export function initSmoothScroll() {
  if (lenis || typeof window === 'undefined') return () => {}

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  // Phones and tablets keep the browser's own momentum scrolling (it is already perfectly smooth there).
  if (reduced || !finePointer) return () => {}

  const instance = new Lenis({
    duration: 1.25, // how long one wheel "push" glides
    easing: easeOutExpo,
    wheelMultiplier: 0.85, // slightly slower, more deliberate scroll
    smoothWheel: true,
    syncTouch: false,
    autoRaf: true,
    // Scrollable panels (service picker, modals, legal index) keep native scrolling,
    // the rest of the page keeps Lenis smoothing.
    allowNestedScroll: true,
  })
  lenis = instance

  // Modals and the mobile drawer lock the page with body{overflow:hidden}: pause Lenis while that is on.
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
    lenis.scrollTo(0, immediate ? { immediate: true, force: true } : { duration: 1.4 })
    return
  }
  // 'instant' on purpose: with CSS scroll-behavior:smooth, 'auto' would animate the jump to the top
  // after every page change (that looked like a glitch on phones).
  window.scrollTo({ top: 0, behavior: immediate ? ('instant' as ScrollBehavior) : 'smooth' })
}

// Section anchors carry `scroll-margin-top: 96px`, which Lenis also honours, so
// the offset is applied exactly once and the sticky headers never cover a heading.
export function scrollToSection(target: string | HTMLElement) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.4, easing: easeOutExpo })
    return
  }
  const element =
    typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (!element) return
  const top = element.getBoundingClientRect().top + window.scrollY - 96
  window.scrollTo({ top, behavior: 'smooth' })
}

/**
 * Brings an element into a comfortable spot. Always go through this instead of
 * element.scrollIntoView({ behavior: 'smooth' }): the browser's own smooth scroll fights
 * Lenis and makes the page jitter.
 */
export function scrollToElement(element: HTMLElement, offset = 84) {
  if (lenis) {
    lenis.scrollTo(element, { offset: -offset, duration: 1.1, easing: easeOutExpo })
    return
  }
  const top = element.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top, behavior: 'smooth' })
}
