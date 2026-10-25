import { useState } from 'react'
import { CheckCircle2, Download, MoreVertical, Share, Smartphone } from 'lucide-react'
import { useInstall } from '../lib/InstallContext'
import { useStore } from '../lib/store'
import { Modal, ModalHead } from './ui'

export default function InstallButton({
  label = 'Install App',
  className = '',
}: {
  label?: string
  className?: string
}) {
  const { canPrompt, installed, promptInstall } = useInstall()
  const { toast } = useStore()
  const [helpOpen, setHelpOpen] = useState(false)

  const handleInstall = async () => {
    if (installed) {
      toast('App already installed', 'Open UGrowSMM from your home screen or app drawer.', 'info')
      return
    }
    const outcome = await promptInstall()
    if (outcome === 'accepted') {
      toast('Installing UGrowSMM', 'The app will appear on your home screen in a moment.', 'success')
    } else if (outcome === 'dismissed') {
      toast('Install cancelled', 'You can install any time using the Install App button.', 'info')
    } else {
      setHelpOpen(true)
    }
  }

  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
  const supported = /\b(Chrome|Edg)\//.test(ua) && !/\b(OPR|SamsungBrowser|Firefox|FxiOS|CriOS|EdgiOS)\b/.test(ua)
  if (!supported && !installed) return null

  return (
    <>
      <button
        type="button"
        className={`btn btn-sm ${canPrompt ? 'btn-primary' : 'btn-soft'} ${className}`}
        onClick={handleInstall}
      >
        {installed ? <CheckCircle2 /> : <Download />}
        {installed ? 'App installed' : label}
      </button>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} labelledBy="install-help" width={480}>
        <ModalHead
          id="install-help"
          title="Install UGrowSMM"
          subtitle="Add the panel to your home screen for a full-screen, app-like experience."
          onClose={() => setHelpOpen(false)}
        />
        <div className="install-steps">
          <div className="install-step">
            <span className="install-num">
              <MoreVertical />
            </span>
            <div>
              <div className="t">Open Chrome on your Android</div>
              <div className="d">
                Visit this page, then tap the <b>⋮</b> menu in the top-right corner.
              </div>
            </div>
          </div>
          <div className="install-step">
            <span className="install-num">
              <Download />
            </span>
            <div>
              <div className="t">Choose “Install app”</div>
              <div className="d">Or tap “Add to Home screen” if that’s what Chrome shows.</div>
            </div>
          </div>
          <div className="install-step">
            <span className="install-num">
              <CheckCircle2 />
            </span>
            <div>
              <div className="t">Confirm and launch</div>
              <div className="d">UGrowSMM appears in your app drawer and runs full-screen.</div>
            </div>
          </div>
        </div>

        <div className="info-box" style={{ marginTop: 16 }}>
          <Share />
          <div>
            On iPhone or iPad, open this page in Safari, tap <b>Share</b>, then choose{' '}
            <b>Add to Home Screen</b>. On desktop Chrome, use the install icon in the address bar.
          </div>
        </div>

        <div className="secure-note">
          <Smartphone /> Android Chrome · Edge · desktop Chrome supported
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-primary btn-block" onClick={() => setHelpOpen(false)}>
            Got it
          </button>
        </div>
      </Modal>
    </>
  )
}
