import { Link } from 'react-router-dom'
import { Crown } from 'lucide-react'

/** Small gold "Pro member" tag shown at the top of every page for Pro members. */
export function ProTag({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/pro" className={`pro-tag ${compact ? 'compact' : ''}`} aria-label="Pro member" title="You are a Pro member">
      <Crown size={compact ? 12 : 13} fill="currentColor" aria-hidden="true" />
      <span className="pt-full">Pro Member</span>
      <span className="pt-short">Pro</span>
    </Link>
  )
}

/** Avatar with a gold ring and a tiny crown for Pro members. */
export function ProAvatar({ pro, children }: { pro: boolean; children: React.ReactNode }) {
  if (!pro) return <>{children}</>
  return (
    <span className="pro-avatar">
      {children}
      <span className="pro-avatar-crown" aria-hidden="true"><Crown size={10} fill="currentColor" /></span>
    </span>
  )
}

/** The golden call to action. `to` is a route; use the `onClick` form for in-page actions. */
export function ProButton({
  to,
  label = 'Become a Pro Member',
  size = 'md',
  onClick,
  block = false,
}: {
  to?: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  block?: boolean
}) {
  const cls = `pro-btn ${size} ${block ? 'block' : ''}`
  const inner = (
    <>
      <span className="pro-btn-crown" aria-hidden="true"><Crown fill="currentColor" /></span>
      <span className="pro-btn-label">{label}</span>
      <span className="pro-btn-shine" aria-hidden="true" />
    </>
  )
  return to ? (
    <Link to={to} className={cls} onClick={onClick}>{inner}</Link>
  ) : (
    <button type="button" className={cls} onClick={onClick}>{inner}</button>
  )
}
