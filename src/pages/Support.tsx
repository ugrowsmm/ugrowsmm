import { useState } from 'react'
import { CheckCircle2, Clock, Crown, Loader2, Send } from 'lucide-react'
import { isProState, useStore, type Ticket } from '../lib/store'
import { apiReady, rpc } from '../lib/api'
import { timeAgo } from '../lib/data'
import { PRO_SUPPORT_EMAIL, WEB3FORMS_KEY } from '../lib/config'
import { InfoBox } from '../components/ui'

const TYPES = ['Query', 'Complaint', 'Order issue', 'Payment issue']
export const RESOLUTION_TIME = '24–48 hours'

export default function Support() {
  const { state, toast, addTicket, refreshAccount } = useStore()
  const [type, setType] = useState(TYPES[0])
  const [orderId, setOrderId] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [ticket, setTicket] = useState('')

  /** Best-effort email copy to the owner. The ticket itself is saved in the database and shows up in the admin panel either way. */
  const notify = (id: string) =>
    WEB3FORMS_KEY.startsWith('PASTE_')
      ? Promise.resolve(false)
      : fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            subject: `[UGrowSMM ${type}] ${subject.trim()} (${id})`,
            from_name: state.profile.name,
            email: state.profile.email,
            type, order_id: orderId, ticket: id, message,
          }),
        }).then((r) => r.json()).then((j) => !!j.success).catch(() => false)

  const send = async () => {
    if (subject.trim().length < 3 || message.trim().length < 10)
      return toast('Add more details', 'Write a subject and at least a short description.', 'error')
    setBusy(true)
    try {
      if (state.real && apiReady()) {
        const { data, error } = await rpc<string>('create_ticket', { p_type: type, p_order_ref: orderId.trim(), p_subject: subject.trim(), p_message: message.trim() })
        if (error || !data) {
          toast('Could not send', error === 'rate_limited' ? 'You have raised several tickets in the last hour. Please wait a little.' : 'Please try again in a minute.', 'error')
          return
        }
        void notify(data)
        void refreshAccount()
        setTicket(data)
      } else {
        if (WEB3FORMS_KEY.startsWith('PASTE_'))
          return toast('Support form not connected yet', 'The site owner needs to add the Web3Forms key.', 'error')
        const id = 'TKT-' + Math.floor(10000 + Math.random() * 89999)
        if (!(await notify(id))) throw new Error()
        const t: Ticket = { id, type, orderId: orderId.trim(), subject: subject.trim(), message: message.trim(), status: 'Open', createdAt: new Date().toISOString() }
        addTicket(t)
        setTicket(id)
      }
      setSubject(''); setMessage(''); setOrderId('')
    } catch {
      toast('Could not send', 'Please try again in a minute.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Support</span>
          <h1>Contact us</h1>
          <p>Raise a query or complaint. We coordinate with you over email and resolve most tickets within {RESOLUTION_TIME}.</p>
        </div>
      </div>
      {isProState(state) ? (
        <div className="pro-ref pro-ref-on">
          <span className="pro-ref-crown" aria-hidden="true"><Crown fill="currentColor" /></span>
          <div>
            <b>Pro priority support, 24/7</b>
            <p>Email <a href={`mailto:${PRO_SUPPORT_EMAIL}`}>{PRO_SUPPORT_EMAIL}</a> any time. Mention your account email so we can find you fast.</p>
          </div>
        </div>
      ) : null}
      <div className="grid-2">
        <div className="card card-pad stack">
          {ticket ? (
            <div className="empty"><span className="ic"><CheckCircle2 /></span><b>Ticket {ticket} created</b><span>Expected resolution time: {RESOLUTION_TIME}. We will email {state.profile.email}.</span>
              <button className="btn btn-soft btn-sm" type="button" onClick={() => setTicket('')}>Send another</button></div>
          ) : (
            <>
              <div className="grid-2-eq">
                <div className="field"><label className="label" htmlFor="st">Type</label>
                  <select id="st" className="select" value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
                <div className="field"><label className="label" htmlFor="so">Order ID <span className="hint">optional</span></label>
                  <input id="so" className="input" value={orderId} onChange={(e) => setOrderId(e.target.value)} /></div>
              </div>
              <div className="field"><label className="label" htmlFor="ss">Subject</label><input id="ss" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
              <div className="field"><label className="label" htmlFor="sm">Message</label><textarea id="sm" className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} /></div>
              <button className="btn btn-primary" type="button" onClick={send} disabled={busy}>{busy ? <Loader2 className="spin" /> : <Send />} Send ticket</button>
            </>
          )}
        </div>
        <div className="stack">
          <InfoBox>You are logged in as <b>{state.profile.email}</b>. We will reply to this email.</InfoBox>
          <InfoBox><b>Resolution time: {RESOLUTION_TIME}.</b> We follow up on your registered email and mark the ticket Resolved here once it is sorted.</InfoBox>
          <InfoBox>For payment issues, include your UPI reference number. For order issues, include the order ID.</InfoBox>
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 16 }}>
        <div className="card-title" style={{ marginBottom: 8 }}>Your tickets</div>
        {state.tickets.length === 0 ? (
          <span className="small muted">No tickets yet. Tickets you raise will appear here.</span>
        ) : (
          state.tickets.map((t) => (
            <div key={t.id} className="detail-row" style={{ alignItems: 'flex-start' }}>
              <span className="k" style={{ minWidth: 0 }}>
                <b style={{ color: 'var(--ink)' }}>{t.id}</b> · {t.subject}
                <span className="tiny faint" style={{ display: 'block' }}>
                  {t.type}{t.orderId ? ` · Order ${t.orderId}` : ''} · {timeAgo(t.createdAt)}
                </span>
              </span>
              <span className="v" style={{ textAlign: 'right' }}>
                {t.status === 'Resolved' ? (
                  <span className="badge badge-green"><CheckCircle2 size={12} /> Resolved</span>
                ) : (
                  <span className="badge badge-amber"><Clock size={12} /> Open</span>
                )}
                {t.status === 'Open' ? <span className="tiny faint" style={{ display: 'block' }}>Resolution: {RESOLUTION_TIME}</span> : null}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
