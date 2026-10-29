import { useState } from 'react'
import { BadgeCheck, Crown, Gift, Landmark, Users, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PRO_DISCOUNT_PERCENT, PRO_REFERRAL_PERCENT, REFERRAL_PERCENT_DEFAULT, isProState, referralAvailable, referralPercentOf, useStore } from '../lib/store'
import { formatINR, timeAgo } from '../lib/data'
import BonusBanner from '../components/BonusBanner'
import { ProButton, ProTag } from '../components/ProBits'
import { CopyButton, InfoBox, Modal, ModalHead, Segmented } from '../components/ui'

export default function Referral() {
  const { state, requestWithdraw, toast } = useStore()
  const { referral, withdrawals } = state
  const pro = isProState(state)
  const percent = referralPercentOf(state)
  const available = referralAvailable(referral)
  const link = `${location.origin}${location.pathname}#/login?ref=${referral.code}`
  const promo = `Use my code ${referral.code} on UGrowSMM and get 50,000 FREE Instagram views on your first ₹100 top-up. Sign up here: ${link}`

  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<'UPI' | 'Bank'>('UPI')
  const [upi, setUpi] = useState('')
  const [holder, setHolder] = useState('')
  const [acc, setAcc] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr('')
    let details = upi.trim()
    if (method === 'UPI' && !/^[\w.\-]{2,}@[\w]{2,}$/.test(details)) return setErr('Enter a valid UPI ID, e.g. name@okhdfcbank.')
    if (method === 'Bank') {
      if (!holder.trim() || !/^\d{9,18}$/.test(acc.trim()) || !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(ifsc.trim()))
        return setErr('Check account holder, account number (9–18 digits) and IFSC.')
      details = `${holder.trim()} | A/C ${acc.trim()} | IFSC ${ifsc.trim().toUpperCase()}`
    }
    const r = await requestWithdraw(Number(amount), method, details)
    if (!r.ok) return setErr(r.error ?? 'Could not submit withdrawal.')
    setDone(true)
  }
  const close = () => { setOpen(false); setDone(false); setAmount(''); setErr('') }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Affiliate</span>
          <h1>Refer &amp; earn {percent}% {pro ? <ProTag /> : null}</h1>
          <p>Earn {percent}% of every wallet top-up made by people who join with your link. Withdraw your referral earnings any time.</p>
        </div>
        <button type="button" className="btn btn-lime" onClick={() => setOpen(true)} disabled={available < 100}>
          <Wallet /> Withdraw {available >= 100 ? formatINR(available) : ''}
        </button>
      </div>

      {pro ? (
        <div className="pro-ref pro-ref-on">
          <span className="pro-ref-crown" aria-hidden="true"><Crown fill="currentColor" /></span>
          <div>
            <b>You earn the Pro rate: {percent}% on every top-up</b>
            <p>You get {percent}% every time your referrals add money. Use it for your orders or withdraw it.</p>
          </div>
        </div>
      ) : (
        <div className="pro-ref">
          <span className="pro-ref-crown" aria-hidden="true"><Crown fill="currentColor" /></span>
          <div className="pro-ref-copy">
            <b>Earn {PRO_REFERRAL_PERCENT}% instead of {REFERRAL_PERCENT_DEFAULT}% with Pro</b>
            <p>Pro members get the full {PRO_REFERRAL_PERCENT}% on every referral, and pay {PRO_DISCOUNT_PERCENT}% less on their own orders.</p>
          </div>
          <ProButton to="/pro" label="Become a Pro Member" />
        </div>
      )}

      <BonusBanner variant="creator" note="Tell your audience: use my code and get 50,000 free Instagram views on the first ₹100 top-up. You earn your referral percentage on every top-up they make." />

      <div className="stats" style={{ marginTop: 16 }}>
        <div className="stat"><div className="stat-top">Total earned <span className="icon"><Gift /></span></div><div className="stat-value">{formatINR(referral.earned)}</div></div>
        <div className="stat"><div className="stat-top">Available <span className="icon"><Wallet /></span></div><div className="stat-value">{formatINR(available)}</div></div>
        <div className="stat"><div className="stat-top">Withdrawn / used <span className="icon"><Landmark /></span></div><div className="stat-value">{formatINR(referral.withdrawn + referral.spent)}</div></div>
        <div className={`stat ${pro ? 'stat-pro' : ''}`}><div className="stat-top">Your rate <span className="icon">{pro ? <Crown /> : <Users />}</span></div><div className="stat-value">{percent}%</div></div>
      </div>

      <div className="grid-2 section">
        <div className="card card-pad stack">
          <div>
            <div className="card-title" style={{ marginBottom: 10 }}>Your referral link</div>
            <div className="api-key-box"><code>{link}</code><div className="actions"><CopyButton text={link} onCopied={() => toast('Link copied')} /></div></div>
          </div>

          <div>
            <div className="between" style={{ marginBottom: 10 }}>
              <div className="card-title">Promo text</div>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => { void navigator.clipboard?.writeText(promo); toast('Promo text copied') }}>Copy promo text</button>
            </div>
            <p className="promo-box">{promo}</p>
          </div>

          <div>
            <div className="card-title" style={{ marginBottom: 10 }}>Promo code</div>
            <div className="api-key-box"><code>{referral.code}</code><div className="actions"><CopyButton text={referral.code} onCopied={() => toast('Code copied')} /></div></div>
          </div>

          <InfoBox>Only earnings from referrals can be withdrawn. Your wallet balance is used for orders and is not withdrawable. You can also spend referral funds on orders. Minimum withdrawal ₹100.</InfoBox>
        </div>
        <div className="card card-pad">
          <div className="between" style={{ marginBottom: 8 }}>
            <div className="card-title">Withdrawals</div>
            <Link to="/billing" className="text-btn">View all</Link>
          </div>
          {withdrawals.length === 0 ? <span className="small muted">No withdrawals yet.</span> : withdrawals.map((w) => (
            <div key={w.id} className="detail-row">
              <span className="k">{w.method} · {timeAgo(w.createdAt)}</span>
              <span className="v">{formatINR(w.amount)} <span className={`badge ${w.status === 'Paid' ? 'badge-green' : w.status === 'Rejected' ? 'badge-red' : 'badge-amber'}`}>{w.status}</span></span>
            </div>
          ))}
        </div>
      </div>

      <Modal open={open} onClose={close} labelledBy="wd" width={460}>
        {done ? (
          <>
            <div className="modal-icon success"><BadgeCheck /></div>
            <ModalHead id="wd" title="Withdrawal successful" subtitle="Your amount will be received within 24 hours." onClose={close} />
            <button className="btn btn-primary btn-block" type="button" onClick={close}>Done</button>
          </>
        ) : (
          <>
            <ModalHead id="wd" title="Withdraw referral funds" subtitle={`Available: ${formatINR(available)}`} onClose={close} />
            <div className="stack">
              <div className="field"><label className="label" htmlFor="wda">Amount</label>
                <input id="wda" className="input" type="number" min={100} max={available} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₹100 minimum" /></div>
              <Segmented label="Payout method" options={['UPI', 'Bank'] as const} value={method} onChange={setMethod} />
              {method === 'UPI' ? (
                <div className="field"><label className="label" htmlFor="wdu">UPI ID</label><input id="wdu" className="input" value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@okhdfcbank" /></div>
              ) : (
                <>
                  <div className="field"><label className="label" htmlFor="wdh">Account holder</label><input id="wdh" className="input" value={holder} onChange={(e) => setHolder(e.target.value)} /></div>
                  <div className="field"><label className="label" htmlFor="wdn">Account number</label><input id="wdn" className="input" inputMode="numeric" value={acc} onChange={(e) => setAcc(e.target.value)} /></div>
                  <div className="field"><label className="label" htmlFor="wdi">IFSC</label><input id="wdi" className="input" value={ifsc} onChange={(e) => setIfsc(e.target.value)} placeholder="HDFC0001234" /></div>
                </>
              )}
              {err ? <div className="error-line">{err}</div> : null}
              <button className="btn btn-primary btn-block" type="button" onClick={submit}>Request withdrawal</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
