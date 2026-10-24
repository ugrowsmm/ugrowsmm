import { useState } from 'react'
import { Eye } from 'lucide-react'
import { useStore } from '../lib/store'
import { BONUS_VIEWS } from '../lib/data'
import { Modal, ModalHead } from './ui'

/** Shows up after a qualifying first top-up and lets the user claim the free views. */
export default function BonusClaim() {
  const { state, claimBonus, toast } = useStore()
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState('')
  const [err, setErr] = useState('')
  if (state.bonus !== 'ready') return null

  const submit = async () => {
    const r = await claimBonus(link.trim())
    if (!r.ok) return setErr(r.error ?? 'Could not claim the bonus.')
    setOpen(false)
    toast('Bonus claimed', `${BONUS_VIEWS.toLocaleString('en-IN')} free views are on the way.`)
  }

  return (
    <>
      <div className="bonus-banner bonus-ready" role="status">
        <div className="bonus-badge" aria-hidden="true"><Eye size={18} /><b>{BONUS_VIEWS / 1000}K</b><span>FREE</span></div>
        <div className="grow">
          <div className="bonus-title">Your {BONUS_VIEWS.toLocaleString('en-IN')} free Instagram views are ready</div>
          <p className="bonus-text">Paste your reel or post link to start delivery.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>Claim now</button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} labelledBy="bonus-t" width={440}>
        <ModalHead id="bonus-t" title="Claim free Instagram views" subtitle="Public reel or post link only." onClose={() => setOpen(false)} />
        <div className="field">
          <label className="label" htmlFor="bonus-l">Instagram link</label>
          <input id="bonus-l" className="input" placeholder="https://instagram.com/reel/…" value={link} onChange={(e) => { setLink(e.target.value); setErr('') }} />
          {err ? <div className="error-line">{err}</div> : null}
        </div>
        <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={submit}>Start free delivery</button>
      </Modal>
    </>
  )
}
