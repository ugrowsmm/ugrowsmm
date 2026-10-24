import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, Loader2, Send } from 'lucide-react'
import { useStore, type Ticket } from '../lib/store'
import { apiReady, callApi } from '../lib/api'
import { timeAgo } from '../lib/data'
import { WEB3FORMS_KEY } from '../lib/config'
import { InfoBox } from '../components/ui'

const TYPES = ['Query', 'Complaint', 'Order issue', 'Payment issue']
export const RESOLUTION_TIME = '24–48 hours'

export default function Support() {
  const { state, toast, addTicket, syncTickets } = useStore()
  const [type, setType] = useState(TYPES[0])
  const [orderId, setOrderId] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [ticket, setTicket] = useState('')

  // pull the latest ticket statuses (admin resolves tickets in the admin panel)
  useEffect(() => {
    if (!apiReady()) return
    void callApi<{ tickets?: Ticket[] }>('myTickets', { email: state.profile.email }).then((r) => {
      if (Array.isArray(r.tickets)) syncTickets(r.tickets)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const send = async () => {
    if (subject.trim().length < 3 || message.trim().length < 10)
      return toast('Add more details', 'Write a subject and at least a short description.', 'error')
    if (WEB3FORMS_KEY.startsWith('PASTE_'))
      return toast('Support form not connected yet', 'The site owner needs to add the Web3Forms key.', 'error')
    setBusy(true)
    const id = 'TKT-' + Math.floor(10000 + Math.random() * 89999)
    try {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `[UGrowSMM ${type}] ${subject.trim()} (${id})`,
          from_name: state.profile.name,
          email: state.profile.email,
          type, order_id: orderId, ticket: id, message,
        }),
      })
      const j = await r.json()
      if (!j.success) throw new Error()
      const t: Ticket = { id, type, orderId: orderId.trim(), subject: subject.trim(), message: message.trim(), status: 'Open', createdAt: new Date().toISOString() }
      addTicket(t)
      void callApi('createTicket', { email: state.profile.email, ...t })
      setTicket(id)
      setSubject(''); setMessage(''); setOrderId('')
    } catch {
      toast('Could not send', 'Please try again in a minute.', 'error')
    }
    setBusy(false)
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
