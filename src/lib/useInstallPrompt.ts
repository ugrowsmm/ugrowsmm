import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable'

const isStandalone = () => {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandalone)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isChrome, setIsChrome] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    setIsAndroid(/Android/i.test(ua))
    setIsChrome(/Chrome|CriOS/i.test(ua) && !/Edg|OPR|Firefox/i.test(ua))

    const onPrompt = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    const media = window.matchMedia('(display-mode: standalone)')
    const onMode = () => setInstalled(isStandalone())
    media.addEventListener?.('change', onMode)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      media.removeEventListener?.('change', onMode)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (!deferred) return 'unavailable'
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome === 'accepted') {
      setInstalled(true)
      setDeferred(null)
    }
    return choice.outcome
  }, [deferred])

  return { canPrompt: deferred !== null, installed, isAndroid, isChrome, promptInstall }
}
