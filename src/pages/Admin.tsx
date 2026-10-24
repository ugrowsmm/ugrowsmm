import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { canAccessAdmin } from '../lib/admins'
import { ArrowLeft, CheckCircle2, Clock, Gift, Lock, Percent, RotateCcw, Search, Trash2, Wallet, XCircle } from 'lucide-react'
import { REFERRAL_PERCENT_DEFAULT, useStore } from '../lib/store'
import { callApi, apiReady } from '../lib/api'
import { formatINR, timeAgo, type OrderStatus } from '../lib/data'
import { InfoBox, Modal, ModalHead, Segmented, StatusBadge } from '../components/ui'

const TABS = ['Users', 'Orders', 'Payouts', 'Tickets', 'Demo'] as const
const ORDER_STATUSES: OrderStatus[] = ['Pending', 'In progress', 'Completed', 'Partial', 'Canceled']
const ORDER_FILTERS = ['All', 'Needs attention', 'Pending', 'In progress', 'Completed', 'Canceled'] as const
const STUCK_AFTER_HOURS = 6
type Tab = (typeof TABS)[number]
type ActType = 'funds' | 'referral' | 'cashback' | 'delete'
interface AdminUser { email: string; name: string; code: string; refBy: string }
interface AdminOrder { id: string; email: string; name: string; link: string; qty: number; charge: number; status: OrderStatus; createdAt: string; tag: string }
interface AdminPayout { key: string; row?: number; localId?: string; email: string; amount: number; method: string; details: string; status: 'Processing' | 'Paid' | 'Rejected'; createdAt: string }
interface AdminTicket { id: string; email: string; type: string; orderId: string; subject: string; message: string; status: 'Open' | 'Resolved'; createdAt: string }

const normOrderStatus = (v: unknown): OrderStatus => {
  const t = String(v ?? '').toLowerCase()
  if (t.startsWith('complete') || t === 'success') return 'Completed'
  if (t.startsWith('cancel') || t === 'failed') return 'Canceled'
  if (t.startsWith('partial')) return 'Partial'
  if (t.startsWith('in progress') || t === 'processing') return 'In progress'
  return 'Pending'
}
const normPayoutStatus = (v: unknown): AdminPayout['status'] => {
  const t = String(v ?? '').toLowerCase()
  return t === 'paid' ? 'Paid' : t === 'rejected' ? 'Rejected' : 'Processing'
}
const isStuck = (o: AdminOrder) => (o.status === 'Pending' || o.status === 'In progress') && Date.now() - new Date(o.createdAt).getTime() > STUCK_AFTER_HOURS * 3.6e6

export default function Admin() {
  const s = useStore()
  const { state, toast } = s
  const [token, setToken] = useState(() => sessionStorage.getItem('ug_admin') ?? '')
  const [ok, setOk] = useState(false)
  const [tab, setTab] = useState<Tab>('Users')
  const [remote, setRemote] = useState<any>(null)
  const [q, setQ] = useState('')
  const [act, setAct] = useState<{ type: ActType; user: AdminUser } | null>(null)
  const [amount, setAmount] = useState('')
  const [kind, setKind] = useState<'paid' | 'unpaid'>('paid')
  const [pct, setPct] = useState('20')
  const [orderFilter, setOrderFilter] = useState<(typeof ORDER_FILTERS)[number]>('All')
  const [orderAct, setOrderAct] = useState<AdminOrder | null>(null)
  const [newStatus, setNewStatus] = useState<OrderStatus>('Completed')
  const [refund, setRefund] = useState(true)
  const [payoutAct, setPayoutAct] = useState<{ p: AdminPayout; to: 'Paid' | 'Rejected' } | null>(null)

  const load = useCallback(async (t: string) => {
    const r: any = await callApi('adminOverview', { adminToken: t })
    if (!r.error) setRemote(r)
    return r
  }, [])

  const login = async () => {
    if (apiReady()) {
      const r = await load(token)
      if (r.error) return toast('Wrong admin token', undefined, 'error')
    }
    sessionStorage.setItem('ug_admin', token)
    setOk(true)
  }
  const allowed = state.signedIn && canAccessAdmin(state.profile.email)
  useEffect(() => { if (allowed && (token || !apiReady())) void login() /* eslint-disable-next-line */ }, [allowed])

  if (!allowed) return <Navigate to="/" replace />

  if (!ok)
    return (
      <div className="page" style={{ maxWidth: 440 }}>
        <div className="card card-pad stack">
          <div className="modal-icon"><Lock /></div>
          <h1 style={{ fontSize: 24 }}>Admin panel</h1>
          <input className="input" type="password" placeholder="Admin token" value={token} onChange={(e) => setToken(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()} />
          <button className="btn btn-primary" type="button" onClick={login}>Open</button>
          <Link to="/" className="text-btn"><ArrowLeft /> Back to site</Link>
        </div>
      </div>
    )

  const users: AdminUser[] = remote?.users?.length
    ? remote.users.map((r: any[]) => ({ email: String(r[0]), name: String(r[1] ?? ''), code: String(r[2] ?? ''), refBy: String(r[3] ?? '') }))
    : [{ email: state.profile.email, name: state.profile.name, code: state.referral.code, refBy: state.refBy }]
  const shown = users.filter((u) => (u.email + u.name + u.code).toLowerCase().includes(q.toLowerCase()))
  const orders: AdminOrder[] = remote?.orders?.length
    ? remote.orders.map((r: any[]) => ({ id: String(r[0]), email: String(r[1] ?? ''), name: String(r[2] ?? ''), link: String(r[3] ?? ''), qty: Number(r[4]) || 0, charge: Number(r[5]) || 0, status: normOrderStatus(r[6]), createdAt: String(r[7] ?? ''), tag: '' }))
    : state.orders.map((o) => ({ id: o.id, email: state.profile.email, name: o.serviceName, link: o.link, qty: o.quantity, charge: o.charge, status: o.status, createdAt: o.createdAt, tag: o.mock ? 'Demo' : o.bonus ? 'Bonus' : '' }))
  const payouts: AdminPayout[] = remote?.withdrawals?.length
    ? remote.withdrawals.map((r: any[], i: number) => ({ key: 'r' + i, row: i + 1, email: String(r[1] ?? ''), amount: Number(r[2]) || 0, method: r[3] ? 'UPI' : 'Bank', details: String(r[3] || r[4] || ''), status: normPayoutStatus(r[5]), createdAt: String(r[0] ?? '') })).reverse()
    : state.withdrawals.map((w) => ({ key: w.id, localId: w.id, email: state.profile.email, amount: w.amount, method: w.method, details: w.details, status: normPayoutStatus(w.status), createdAt: w.createdAt }))
  const tickets: AdminTicket[] = remote?.tickets?.length
    ? remote.tickets.map((r: any[]) => ({ id: String(r[0]), email: String(r[1] ?? ''), type: String(r[2] ?? ''), orderId: String(r[3] ?? ''), subject: String(r[4] ?? ''), message: String(r[5] ?? ''), status: String(r[6]).toLowerCase() === 'resolved' ? 'Resolved' : 'Open', createdAt: String(r[7] ?? '') }))
    : state.tickets.map((t) => ({ id: t.id, email: state.profile.email, type: t.type, orderId: t.orderId, subject: t.subject, message: t.message, status: t.status, createdAt: t.createdAt }))
  const shownOrders = orders.filter((o) => orderFilter === 'All' ? true : orderFilter === 'Needs attention' ? isStuck(o) : o.status === orderFilter)
  const openTickets = tickets.filter((t) => t.status === 'Open').length
  const isLocal = (email: string) => email.trim().toLowerCase() === state.profile.email.toLowerCase()

  const close = () => { setAct(null); setAmount('') }
  const run = async () => {
    if (!act) return
    const { type, user } = act
    const a = Number(amount)
    if ((type === 'funds' || type === 'referral') && !(a > 0)) return toast('Enter a valid amount', undefined, 'error')
    if (type === 'cashback' && !(Number(pct) >= 0 && Number(pct) <= 100)) return toast('Percent must be 0–100', undefined, 'error')
    const payload =
      type === 'funds' ? ['adminAddFunds', { email: user.email, amount: a, kind }]
      : type === 'referral' ? ['adminAddReferral', { email: user.email, amount: a }]
      : type === 'cashback' ? ['adminSetCashback', { code: user.code, percent: Number(pct) }]
      : ['adminDeleteUser', { email: user.email }]
    const r: any = await callApi(payload[0] as string, { adminToken: token, ...(payload[1] as object) })
    if (r.error && apiReady()) return toast('Failed', r.error, 'error')
    if (type === 'funds' && isLocal(user.email)) s.adminCredit(kind, a)
    if (type === 'referral' && isLocal(user.email)) s.adminReferralEarning(a)
    if (type === 'cashback') s.setCashback(user.code, Number(pct))
    if (type === 'delete' && isLocal(user.email)) s.deleteAccount()
    toast('Done', type === 'delete' ? `${user.email} deleted` : 'Saved')
    close()
    if (apiReady()) void load(token)
  }

  const saveOrderStatus = async () => {
    if (!orderAct) return
    const o = orderAct
    const r: any = await callApi('adminSetOrderStatus', { adminToken: token, id: o.id, status: newStatus, refund: refund && newStatus === 'Canceled' })
    if (r.error && apiReady()) return toast('Failed', r.error, 'error')
    if (state.orders.some((x) => x.id === o.id)) s.adminSetOrderStatus(o.id, newStatus, refund)
    toast('Order updated', `${o.id} is now ${newStatus}`)
    setOrderAct(null)
    if (apiReady()) void load(token)
  }
  const savePayout = async () => {
    if (!payoutAct) return
    const { p, to } = payoutAct
    const r: any = await callApi('adminSetWithdrawalStatus', { adminToken: token, row: p.row, email: p.email, status: to })
    if (r.error && apiReady()) return toast('Failed', r.error, 'error')
    const local = p.localId ?? state.withdrawals.find((w) => w.amount === p.amount && w.status === 'Processing')?.id
    if (local && isLocal(p.email)) s.adminSetWithdrawalStatus(local, to)
    toast(to === 'Paid' ? 'Marked as paid' : 'Payout rejected', to === 'Rejected' ? 'Amount returned to the user’s referral funds.' : undefined)
    setPayoutAct(null)
    if (apiReady()) void load(token)
  }
  const setTicket = async (t: AdminTicket, status: 'Open' | 'Resolved') => {
    const r: any = await callApi('adminSetTicketStatus', { adminToken: token, id: t.id, status })
    if (r.error && apiReady()) return toast('Failed', r.error, 'error')
    s.adminSetTicketStatus(t.id, status)
    toast(status === 'Resolved' ? 'Ticket resolved' : 'Ticket reopened', t.id)
    if (apiReady()) void load(token)
  }

  return (
    <div className="page adm">
      <div className="page-head">
        <div><span className="eyebrow">Admin</span><h1>Control panel</h1></div>
        <Link to="/" className="btn btn-ghost btn-sm"><ArrowLeft /> Site</Link>
      </div>
      <div className="adm-tabs"><Segmented label="Admin sections" options={TABS} value={tab} onChange={setTab} /></div>

      {tab === 'Users' && (
        <div className="stack">
          <div className="searchbox" style={{ minWidth: 0 }}><Search size={15} /><input placeholder="Search email or code" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          {shown.map((u) => (
            <div key={u.email} className="card card-pad adm-user">
              <div className="row"><span className="avatar">{(u.name || u.email).slice(0, 2).toUpperCase()}</span>
                <div className="grow"><b className="adm-email">{u.email}</b>
                  <div className="tiny faint">Code {u.code}{u.refBy ? ` · referred by ${u.refBy}` : ''} · {state.codePercents[u.code] ?? REFERRAL_PERCENT_DEFAULT}% cashback</div></div></div>
              <div className="adm-actions">
                <button type="button" className="btn btn-soft btn-sm" onClick={() => setAct({ type: 'funds', user: u })}><Wallet /> Add funds</button>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => setAct({ type: 'referral', user: u })}><Gift /> Referral funds</button>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => { setPct(String(state.codePercents[u.code] ?? REFERRAL_PERCENT_DEFAULT)); setAct({ type: 'cashback', user: u }) }}><Percent /> Cashback %</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setAct({ type: 'delete', user: u })}><Trash2 /> Delete</button>
              </div>
            </div>
          ))}
          {shown.length === 0 ? <div className="empty"><b>No users found</b></div> : null}
          <div className="card-title">Recent logins</div>
          {(remote?.logins?.length ? remote.logins.map((l: any[]) => [l[1], String(l[0])]) : state.logins.map((l) => [l.email, new Date(l.at).toLocaleString('en-IN')])).slice(0, 15).map((r: any[], i: number) => (
            <div key={i} className="detail-row"><span className="k">{r[0]}</span><span className="v">{r[1]}</span></div>
          ))}
        </div>
      )}

      {tab === 'Orders' && (
        <div className="stack">
          <div className="adm-tabs"><Segmented label="Filter orders" options={ORDER_FILTERS} value={orderFilter} onChange={setOrderFilter} /></div>
          <InfoBox>If an order’s automatic status is stuck, open it and set the real status. “Needs attention” shows Pending or In progress orders older than {STUCK_AFTER_HOURS} hours.</InfoBox>
          {shownOrders.length ? shownOrders.map((o) => (
            <div key={o.id} className="card card-pad adm-user">
              <div className="between" style={{ gap: 10, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <b className="adm-email">#{o.id} · {o.name}{o.tag ? ` (${o.tag})` : ''}</b>
                  <div className="tiny faint adm-email">{o.email} · {o.qty.toLocaleString('en-IN')} qty · {formatINR(o.charge)}{o.createdAt ? ` · ${timeAgo(o.createdAt)}` : ''}</div>
                  <div className="tiny faint adm-email">{o.link}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
              {isStuck(o) ? <span className="badge badge-amber" style={{ width: 'fit-content' }}><Clock size={12} /> Possibly stuck</span> : null}
              <button type="button" className="btn btn-soft btn-sm" onClick={() => { setNewStatus(o.status === 'Completed' ? 'Pending' : 'Completed'); setRefund(true); setOrderAct(o) }}><RotateCcw /> Change status</button>
            </div>
          )) : <div className="empty"><b>No orders here</b></div>}
        </div>
      )}
      {tab === 'Payouts' && (
        <div className="stack">
          {payouts.length ? payouts.map((p) => (
            <div key={p.key} className="card card-pad adm-user">
              <div className="between" style={{ gap: 10, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <b className="adm-email">{formatINR(p.amount)} · {p.method}</b>
                  <div className="tiny faint adm-email">{p.email}{p.createdAt ? ` · ${timeAgo(p.createdAt)}` : ''}</div>
                  <div className="tiny" style={{ wordBreak: 'break-all', marginTop: 4 }}>{p.details}</div>
                </div>
                <span className={`badge ${p.status === 'Paid' ? 'badge-green' : p.status === 'Rejected' ? 'badge-red' : 'badge-amber'}`}>{p.status}</span>
              </div>
              {p.status === 'Processing' ? (
                <div className="adm-actions">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setPayoutAct({ p, to: 'Paid' })}><CheckCircle2 /> Approve &amp; mark paid</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setPayoutAct({ p, to: 'Rejected' })}><XCircle /> Reject</button>
                </div>
              ) : null}
            </div>
          )) : <div className="empty"><b>No withdraw requests</b></div>}
        </div>
      )}
      {tab === 'Tickets' && (
        <div className="stack">
          <InfoBox>{openTickets} open. Reply to the user by email, then mark the ticket Resolved here. Users see the status and a 24–48 hours resolution time.</InfoBox>
          {tickets.length ? tickets.map((t) => (
            <div key={t.id} className="card card-pad adm-user">
              <div className="between" style={{ gap: 10, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <b className="adm-email">{t.id} · {t.subject}</b>
                  <div className="tiny faint adm-email">{t.email} · {t.type}{t.orderId ? ` · Order ${t.orderId}` : ''}{t.createdAt ? ` · ${timeAgo(t.createdAt)}` : ''}</div>
                </div>
                <span className={`badge ${t.status === 'Resolved' ? 'badge-green' : 'badge-amber'}`}>{t.status}</span>
              </div>
              <p className="small" style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{t.message}</p>
              {t.status === 'Open'
                ? <button type="button" className="btn btn-primary btn-sm" onClick={() => setTicket(t, 'Resolved')}><CheckCircle2 /> Mark resolved</button>
                : <button type="button" className="btn btn-soft btn-sm" onClick={() => setTicket(t, 'Open')}><RotateCcw /> Reopen</button>}
            </div>
          )) : <div className="empty"><b>No tickets yet</b></div>}
        </div>
      )}
      {tab === 'Demo' && (
        <div className="card card-pad stack">
          <InfoBox warn>Demo orders are tagged “Demo”, cost nothing and are never sent to the provider.</InfoBox>
          <button className="btn btn-soft" type="button" onClick={() => { s.adminDemoOrders(5); toast('5 demo orders added') }}>Add 5 demo orders</button>
          <button className="btn btn-soft" type="button" onClick={() => { s.adminReferralEarning(250); toast('₹250 demo referral earning added') }}>Add ₹250 referral earning</button>
        </div>
      )}

      <Modal open={!!orderAct} onClose={() => setOrderAct(null)} labelledBy="adm-o" width={420}>
        {orderAct && (
          <>
            <ModalHead id="adm-o" title="Change order status" subtitle={`#${orderAct.id} · currently ${orderAct.status}`} onClose={() => setOrderAct(null)} />
            <div className="stack">
              <div className="field"><label className="label" htmlFor="adm-os">New status</label>
                <select id="adm-os" className="select" value={newStatus} onChange={(e) => setNewStatus(e.target.value as OrderStatus)}>{ORDER_STATUSES.map((st) => <option key={st}>{st}</option>)}</select></div>
              {newStatus === 'Canceled' && orderAct.status !== 'Canceled' ? (
                <label className="row" style={{ gap: 8, fontSize: 13 }}><input type="checkbox" checked={refund} onChange={(e) => setRefund(e.target.checked)} /> Refund {formatINR(orderAct.charge)} to the user’s wallet</label>
              ) : null}
              <button className="btn btn-primary btn-block" type="button" onClick={saveOrderStatus}>Save status</button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!payoutAct} onClose={() => setPayoutAct(null)} labelledBy="adm-p" width={420}>
        {payoutAct && (
          <>
            <ModalHead id="adm-p" title={payoutAct.to === 'Paid' ? 'Mark payout as paid' : 'Reject payout'} subtitle={`${formatINR(payoutAct.p.amount)} · ${payoutAct.p.email}`} onClose={() => setPayoutAct(null)} />
            <div className="stack">
              {payoutAct.to === 'Paid'
                ? <InfoBox>Confirm only after you have sent the money to <b>{payoutAct.p.details}</b>.</InfoBox>
                : <InfoBox warn>The amount goes back to the user’s referral funds so they can withdraw again.</InfoBox>}
              <button className={`btn ${payoutAct.to === 'Paid' ? 'btn-primary' : 'btn-danger'} btn-block`} type="button" onClick={savePayout}>{payoutAct.to === 'Paid' ? 'Yes, mark paid' : 'Reject payout'}</button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!act} onClose={close} labelledBy="adm-t" width={420}>
        {act && (
          <>
            <ModalHead id="adm-t" title={act.type === 'funds' ? 'Add funds' : act.type === 'referral' ? 'Add referral funds' : act.type === 'cashback' ? 'Affiliate percentage' : 'Delete user'} subtitle={act.user.email} onClose={close} />
            <div className="stack">
              {(act.type === 'funds' || act.type === 'referral') && (
                <input className="input" type="number" inputMode="decimal" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} />
              )}
              {act.type === 'funds' && (
                <>
                  <Segmented label="Credit type" options={['paid', 'unpaid'] as const} value={kind} onChange={setKind} />
                  <InfoBox><b>Paid</b> is real wallet money. <b>Unpaid</b> only places demo orders and is never withdrawable.</InfoBox>
                </>
              )}
              {act.type === 'referral' && <InfoBox>Referral funds are the only balance the user can withdraw.</InfoBox>}
              {act.type === 'cashback' && (
                <>
                  <input className="input" type="number" inputMode="decimal" placeholder="Percent" value={pct} onChange={(e) => setPct(e.target.value)} />
                  <InfoBox>Applies to code <b>{act.user.code}</b> from the next top-up of anyone who joins with it.</InfoBox>
                </>
              )}
              {act.type === 'delete' && <InfoBox warn>This removes the account and cannot be undone.</InfoBox>}
              <button className={`btn ${act.type === 'delete' ? 'btn-danger' : 'btn-primary'} btn-block`} type="button" onClick={run}>
                {act.type === 'delete' ? 'Delete user' : 'Save'}
              </button>
            </div>
          </>
        )}
      </Modal>
      <p className="tiny faint" style={{ marginTop: 18 }}>Paid wallet total shown to user: {formatINR(state.balance)}</p>
    </div>
  )
}
