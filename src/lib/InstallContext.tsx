import { createContext, useContext, type ReactNode } from 'react'
import { useInstallPrompt } from './useInstallPrompt'

type InstallValue = ReturnType<typeof useInstallPrompt>

const InstallContext = createContext<InstallValue | null>(null)

export function InstallProvider({ children }: { children: ReactNode }) {
  const value = useInstallPrompt()
  return <InstallContext.Provider value={value}>{children}</InstallContext.Provider>
}

export function useInstall() {
  const ctx = useContext(InstallContext)
  if (!ctx) throw new Error('useInstall must be used inside InstallProvider')
  return ctx
}
