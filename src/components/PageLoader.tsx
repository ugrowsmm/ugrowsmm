import { LogoGlyph } from './Logo'

export default function PageLoader({ full = false }: { full?: boolean }) {
  return (
    <div className={`ug-loader ${full ? 'full' : ''}`} role="status" aria-label="Loading">
      <span className="ug-loader-mark">
        <LogoGlyph size={26} />
      </span>
      <span className="ug-loader-bar">
        <i />
      </span>
    </div>
  )
}
