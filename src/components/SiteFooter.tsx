import { Link } from 'react-router-dom'
import { Smartphone } from 'lucide-react'
import { LogoGlyph } from './Logo'
import InstallButton from './InstallButton'

export default function SiteFooter() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-mark">
            <LogoGlyph size={20} />
          </span>
          <div>
            <div className="footer-name">
              UGrow<span>SMM</span>
            </div>
            <div className="footer-tag">Premium SMM panel</div>
          </div>
        </div>

        <nav className="footer-links" aria-label="Footer">
          <Link to="/home">Website</Link>
          <Link to="/services">Services</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/add-funds">Wallet</Link>
          <Link to="/api">API</Link>
          <Link to="/settings">Account</Link>
        </nav>

        <div className="footer-right">
          <span className="footer-platform">
            <Smartphone size={12} /> Android · Chrome
          </span>
          <InstallButton />
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-copy">
          © 2026 UGrowSMM. All rights reserved. Made for Indian Creators.
        </div>
        <nav className="footer-legal" aria-label="Legal">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/refund-policy">Refunds</Link>
          <Link to="/cookies">Cookies</Link>
        </nav>
      </div>
    </footer>
  )
}
