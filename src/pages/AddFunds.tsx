import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { BadgeCheck, Clock, Loader2, QrCode, ShieldCheck, Smartphone, Wallet, Zap } from 'lucide-react'
import { useStore } from '../lib/store'
import { apiReady } from '../lib/api'
import { UPI_ID, UPI_NAME } from '../lib/config'
import { formatINR, timeAgo } from '../lib/data'
import BonusBanner from '../components/BonusBanner'
import { InfoBox, Modal, ModalHead } from '../components/ui'

const PRESETS = [200, 500, 1000, 2500, 5000, 10000]
const HOLD_SECONDS = 600

interface Pending {
  txn: string
  amount: number
  upiId: string
}

const APPS = [
  { name: 'PhonePe', src: '/pay/phonepe.png', scheme: 'phonepe://pay' },
  { name: 'Google Pay', src: '/pay/gpay.png', scheme: 'tez://upi/pay' },
  { name: 'Paytm', src: '/pay/paytm.png', scheme: 'paytmmp://pay' },
  { name: 'BHIM UPI', src: '/pay/bhim.png', scheme: 'upi://pay' },
]

const upiQuery = (p: Pending) =>
  `pa=${encodeURIComponent(p.upiId)}&pn=${encodeURIComponent(UPI_NAME)}&am=${p.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('UGrowSMM ' + p.txn)}&tr=${encodeURIComponent(p.txn)}`

export default function AddFunds() {
  const { state, addFunds, refreshAccount, toast } = useStore()
  const [amount, setAmount] = useState(500)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  const [qr, setQr] = useState('')
  const [qrBusy, setQrBusy] = useState(false)
  const [left, setLeft] = useState(HOLD_SECONDS)
  const [paid, setPaid] = useState(false)
  const credited = useRef(false)
  const [vpa, setVpa] = useState(() => { try { return localStorage.getItem('ug_vpa') ?? '' } catch { return '' } })
  const [collectBusy, setCollectBusy] = useState(false)
  const [collectSent, setCollectSent] = useState(false)
  const expires = useRef(0)

  const valid = Number.isFinite(amount) && amount >= 10 && amount <= 50000

  const start = async () => {
    if (!valid) return toast('Enter an amount', 'Minimum ₹10 and maximum ₹50,000.', 'error')
    // Real accounts: automatic top-up is switched on once the payment gateway is connected (nothing is charged before that)
    if (apiReady()) return toast('Top-ups opening soon', 'Online top-up is being switched on. Please check back shortly or contact support.', 'info')
    setBusy(true)
    credited.current = false
    const res: any = {}
    setQr('')
    setCollectSent(false)
    setPaid(false)
    expires.current = Date.now() + HOLD_SECONDS * 1000
    setLeft(HOLD_SECONDS)
    setPending({ txn: res.txn ?? 'UG' + Date.now(), amount, upiId: res.upiId ?? UPI_ID })
    setBusy(false)
  }

  const close = () => setPending(null)

  const sendRequest = async () => {
    if (!pending) return
    const id = vpa.trim()
    if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(id)) return toast('Enter a valid UPI ID', 'Example: name@okhdfcbank', 'error')
    setCollectBusy(true)
    setCollectBusy(false)
    try { localStorage.setItem('ug_vpa', id) } catch { /* ignore */ }
    setCollectSent(true)
    toast('Request sent', 'Open your UPI app and approve the payment.', 'info')
  }

  const complete = (p: Pending) => {
    if (credited.current) return
    credited.current = true
    if (state.real && apiReady()) void refreshAccount()
    else addFunds(p.amount, 'UPI')
    setPaid(true)
    toast('Payment received', `${formatINR(p.amount)} added to your wallet.`)
  }

  const makeQr = async () => {
    if (!pending) return
    setQrBusy(true)
    setQr(await QRCode.toDataURL(`upi://pay?${upiQuery(pending)}`, { width: 440, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } }))
    setQrBusy(false)
  }

  // countdown while the popup is open
  useEffect(() => {
    if (!pending || paid) return
    const tick = window.setInterval(() => {
      const s = Math.max(0, Math.round((expires.current - Date.now()) / 1000))
      setLeft(s)
      if (s === 0) setPending(null)
    }, 1000)
    return () => {
      window.clearInterval(tick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, paid])

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const deposits = state.transactions.filter((t) => t.type === 'deposit').slice(0, 5)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Wallet</span>
          <h1>Add funds</h1>
          <p>Pay securely with UPI. Your balance updates automatically after payment.</p>
        </div>
        <div className="pill lime">Balance {formatINR(state.balance)}</div>
      </div>

      {state.refBy && state.bonus === 'none' ? (
        <div style={{ marginBottom: 16 }}>
          <BonusBanner note={`You joined with code ${state.refBy}. Add ₹100 or more and your free 50,000 Instagram views unlock instantly.`} />
        </div>
      ) : null}

      <div className="funds-layout">
        <div className="card card-pad">
          <div className="label">Payment method</div>
          <div className="upi-method" style={{ marginTop: 10 }}>
            <span className="upi-tile" style={{ background: 'var(--grad)' }}><Smartphone size={18} /></span>
            <div>
              <div className="small" style={{ fontWeight: 800 }}>UPI</div>
              <div className="tiny faint">PhonePe, Google Pay, Paytm, BHIM &amp; any UPI app</div>
            </div>
            <span className="radio" aria-hidden="true" />
          </div>

          <div className="label" style={{ marginTop: 20 }}>Choose amount</div>
          <div className="amount-grid">
            {PRESETS.map((a) => (
              <button key={a} type="button" className={`amount-btn ${amount === a ? 'active' : ''}`} onClick={() => setAmount(a)}>
                <b>{formatINR(a, 0)}</b>
              </button>
            ))}
          </div>
          <div className="field" style={{ marginTop: 16 }}>
            <label className="label" htmlFor="amt">Or enter custom amount <span className="hint">₹10 – ₹50,000</span></label>
            <input id="amt" className="input" type="number" min={10} max={50000} value={Number.isFinite(amount) ? amount : ''} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>

          <button type="button" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 18 }} onClick={start} disabled={busy || !valid}>
            {busy ? <Loader2 className="spin" /> : <Wallet />} Add {valid ? formatINR(amount, 0) : ''} to wallet
          </button>

          <div className="trust-strip">
            <div className="trust-item"><ShieldCheck /> Secure UPI payment</div>
            <div className="trust-item"><Zap /> Auto-credited in seconds</div>
            <div className="trust-item"><Smartphone /> Any UPI app works</div>
          </div>
        </div>

        <div className="stack">
          <InfoBox>Payments are confirmed automatically. If money was deducted but your balance did not update within 10 minutes, raise a ticket from Support with your UPI reference.</InfoBox>
          <div className="card card-pad">
            <div className="card-title" style={{ marginBottom: 8 }}>Recent top-ups</div>
            {deposits.length === 0 ? <span className="small muted">No top-ups yet.</span> : deposits.map((t) => (
              <div key={t.id} className="detail-row"><span className="k">{timeAgo(t.createdAt)}</span><span className="v">+{formatINR(t.amount)}</span></div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={!!pending} onClose={close} labelledBy="pay-title" width={460}>
        {pending && paid ? (
          <>
            <div className="modal-icon success"><BadgeCheck /></div>
            <ModalHead id="pay-title" title="Payment received" subtitle={`${formatINR(pending.amount)} has been added to your wallet.`} onClose={close} />
            <button type="button" className="btn btn-primary btn-block" onClick={close}>Done</button>
          </>
        ) : pending ? (
          <>
            <ModalHead id="pay-title" title={`Pay ${formatINR(pending.amount, 0)}`} subtitle="Choose how you want to pay" onClose={close} />

            <div className="upi-label">Pay with an app</div>
            <div className="upi-apps">
              {APPS.map((a) => (
                <button key={a.name} type="button" className="upi-app" onClick={() => { window.location.href = `${a.scheme}?${upiQuery(pending)}` }}>
                  <span className="upi-logo"><img src={a.src} alt="" width={40} height={40} loading="lazy" decoding="async" /></span>
                  {a.name}
                </button>
              ))}
            </div>
            <p className="tiny faint" style={{ marginTop: 8 }}>Opens the app with the amount already filled. Works on phones.</p>

            <div className="upi-or">or pay with your UPI ID</div>
            <div className="row" style={{ gap: 8 }}>
              <input className="input" placeholder="yourname@okhdfcbank" value={vpa} autoCapitalize="none" autoCorrect="off" spellCheck={false} onChange={(e) => { setVpa(e.target.value); setCollectSent(false) }} />
              <button type="button" className="btn btn-primary" onClick={sendRequest} disabled={collectBusy}>
                {collectBusy ? <Loader2 className="spin" /> : 'Request'}
              </button>
            </div>
            <p className="tiny faint" style={{ marginTop: 8 }}>
              {collectSent
                ? `Request sent to ${vpa.trim()}. Open your UPI app and approve ${formatINR(pending.amount)}.`
                : 'We send a payment request to your UPI app. Approve it there to pay.'}
            </p>

            <div className="upi-or">or scan a QR code</div>
            {qr ? (
              <div className="qr-box"><img src={qr} alt={`UPI QR for ${pending.amount} rupees`} width={220} height={220} /></div>
            ) : (
              <button type="button" className="btn btn-soft btn-block" onClick={makeQr} disabled={qrBusy}>
                {qrBusy ? <Loader2 className="spin" /> : <QrCode />} Generate QR code
              </button>
            )}

            <div className="qr-wait" style={{ marginTop: 16 }}><span className="qr-pulse" /> Waiting for payment · <Clock size={13} /> {mm}:{ss}</div>
            {!apiReady() && (
              <button type="button" className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 10 }} onClick={() => complete(pending)}>Simulate payment received (demo only)</button>
            )}
          </>
        ) : null}
      </Modal>
    </div>
  )
}
