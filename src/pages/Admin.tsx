import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { canAccessAdmin } from '../lib/admins'
import { ArrowLeft, CheckCircle2, Clock, Gift, Lock, Percent, RotateCcw, Search, Trash2, Wallet, XCircle } from 'lucide-react'
import { REFERRAL_PERCENT_DEFAULT, useStore } from '../lib/store'
import { rpc, apiReady } from '../lib/api'
import { formatINR, timeAgo, type OrderStatus } from '../lib/data'
import { InfoBox, Modal, ModalHead, Segmented, StatusBadge } from '../components/ui'

const TABS = ['Users', 'Orders', 'Payouts', 'Tickets', 'Demo'] as const
const ORDER_STATUSES: OrderStatus[] = ['Pending', 'In progress', 'Completed', 'Partial', 'Canceled']
const ORDER_FILTERS = ['All', 'Needs attention', 'Pending', 'In progress', 'Completed', 'Canceled'] as const
const STUCK_AFTER_HOURS = 6
type Tab = (typeof TABS)[number]
type ActType = 'funds' | 'referral' | 'cashback' | 'delete' | 'cutFunds' | 'cutReferral'
interface AdminUser { email: string; name: string; code: string; refBy: string; percent: number; balance: number; earned: number }
interface AdminOrder { id: string; email: string; name: string; link: string; qty: number; charge: number; status: OrderStatus; createdAt: string; tag: string }
interface AdminPayout { key: string; id?: number; localId?: string; email: string; amount: number; method: string; details: string; status: 'Processing' | 'Paid' | 'Rejected'; createdAt: string }
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

/** Add / Cut pill switch inside the Funds and Referral popups (same style as the Sign In / Sign Up switch) */
const ADM_SWITCH_CSS = `
.adm-switch{position:relative;display:grid;grid-template-columns:1fr 1fr;padding:5px;border-radius:999px;background:var(--panel-3,#f1f5f9);border:1px solid rgba(249,115,22,.3);box-shadow:inset 0 1px 2px rgba(16,24,40,.05)}
.adm-switch-thumb{position:absolute;top:5px;bottom:5px;left:5px;width:calc(50% - 5px);border-radius:999px;background:var(--grad,linear-gradient(115deg,#fb923c,#f97316 48%,#ea580c));box-shadow:0 10px 22px -10px rgba(249,115,22,.65);transition:transform .38s cubic-bezier(.22,1,.36,1),background .3s}
.adm-switch[data-active="cut"] .adm-switch-thumb{transform:translateX(100%);background:linear-gradient(115deg,#fb7185,#e11d48 55%,#be123c);box-shadow:0 10px 22px -10px rgba(225,29,72,.6)}
.adm-switch-btn{position:relative;z-index:1;border:0;background:none;cursor:pointer;padding:11px 0;border-radius:999px;font:inherit;font-size:14px;font-weight:700;color:var(--muted,#475467);transition:color .25s}
.adm-switch-btn:hover{color:var(--ink,#0f172a)}
.adm-switch-btn[aria-selected="true"]{color:#fff}
.adm-switch-btn:focus-visible{outline:2px solid rgba(249,115,22,.55);outline-offset:2px}
`

export default function Admin() {
  const s = useStore()
  const { state, toast } = s
  const live = apiReady()
  const [loaded, setLoaded] = useState(!live)
  const [denied, setDenied] = useState(false)
  const [tab, setTab] = useState<Tab>('Users')
  const [remote, setRemote] = useState<any>(null)
  const [q, setQ] = useState('')
  const [act, setAct] = useState<{ type: ActType; user: AdminUser } | null>(null)
  const [amount, setAmount] = useState('')
  const [kind, setKind] = useState<'paid' | 'unpaid'>('paid')
  const [mode, setMode] = useState<'add' | 'cut'>('add')
  const [pct, setPct] = useState('20')
  const [orderFilter, setOrderFilter] = useState<(typeof ORDER_FILTERS)[number]>('All')
  const [orderAct, setOrderAct] = useState<AdminOrder | null>(null)
  const [newStatus, setNewStatus] = useState<OrderStatus>('Completed')
  const [refund, setRefund] = useState(true)
  const [payoutAct, setPayoutAct] = useState<{ p: AdminPayout; to: 'Paid' | 'Rejected' } | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await rpc<any>('admin_overview')
    if (error) { if (error === 'forbidden') setDenied(true); return error }
    setRemote(data)
    setLoaded(true)
    return ''
  }, [])

  const allowed = state.signedIn && canAccessAdmin(state.profile.email)
  useEffect(() => { if (allowed && live) void load() }, [allowed, live, load])

  if (!allowed) return <Navigate to="/" replace />

  if (!loaded)
    return (
      <div className="page" style={{ maxWidth: 440 }}>
        <div className="card card-pad stack">
          <div className="modal-icon"><Lock /></div>
          <h1 style={{ fontSize: 24 }}>Admin panel</h1>
          <p className="small muted">{denied ? 'This account does not have admin access yet. Ask the owner to switch it on in the database.' : 'Loading…'}</p>
          <Link to="/" className="text-btn"><ArrowLeft /> Back to site</Link>
        </div>
      </div>
    )

  const users: AdminUser[] = live
    ? (remote?.users ?? []).map((u: any) => ({ email: String(u.email), name: String(u.name ?? ''), code: String(u.code ?? ''), refBy: String(u.refBy ?? ''), percent: Number(u.percent), balance: Number(u.balance) || 0, earned: Number(u.earned) || 0 }))
    : [{ email: state.profile.email, name: state.profile.name, code: state.referral.code, refBy: state.refBy, percent: state.codePercents[state.referral.code] ?? REFERRAL_PERCENT_DEFAULT, balance: state.balance, earned: state.referral.earned }]
  const shown = users.filter((u) => (u.email + u.name + u.code).toLowerCase().includes(q.toLowerCase()))
  const orders: AdminOrder[] = live
    ? (remote?.orders ?? []).map((o: any) => ({ id: String(o.id), email: String(o.email ?? ''), name: String(o.name ?? ''), link: String(o.link ?? ''), qty: Number(o.qty) || 0, charge: Number(o.charge) || 0, status: normOrderStatus(o.status), createdAt: String(o.createdAt ?? ''), tag: o.demo ? 'Demo' : o.bonus ? 'Bonus' : '' }))
    : state.orders.map((o) => ({ id: o.id, email: state.profile.email, name: o.serviceName, link: o.link, qty: o.quantity, charge: o.charge, status: o.status, createdAt: o.createdAt, tag: o.mock ? 'Demo' : o.bonus ? 'Bonus' : '' }))
  const payouts: AdminPayout[] = live
    ? (remote?.withdrawals ?? []).map((x: any) => ({ key: String(x.id), id: Number(x.id), email: String(x.email ?? ''), amount: Number(x.amount) || 0, method: String(x.method ?? ''), details: String(x.details ?? ''), status: normPayoutStatus(x.status), createdAt: String(x.createdAt ?? '') }))
    : state.withdrawals.map((w) => ({ key: w.id, localId: w.id, email: state.profile.email, amount: w.amount, method: w.method, details: w.details, status: normPayoutStatus(w.status), createdAt: w.createdAt }))
  const tickets: AdminTicket[] = live
    ? (remote?.tickets ?? []).map((t: any) => ({ id: String(t.id), email: String(t.email ?? ''), type: String(t.type ?? ''), orderId: String(t.orderId ?? ''), subject: String(t.subject ?? ''), message: String(t.message ?? ''), status: t.status === 'Resolved' ? 'Resolved' : 'Open', createdAt: String(t.createdAt ?? '') }))
    : state.tickets.map((t) => ({ id: t.id, email: state.profile.email, type: t.type, orderId: t.orderId, subject: t.subject, message: t.message, status: t.status, createdAt: t.createdAt }))
  const shownOrders = orders.filter((o) => orderFilter === 'All' ? true : orderFilter === 'Needs attention' ? isStuck(o) : o.status === orderFilter)
  const openTickets = tickets.filter((t) => t.status === 'Open').length
  const isLocal = (email: string) => email.trim().toLowerCase() === state.profile.email.toLowerCase()

  const close = () => { setAct(null); setAmount('') }
  /** The popup for Funds / Referral has an Add | Cut switch; this turns (popup + switch) into the real action. */
  const effType = (a: { type: ActType }): ActType =>
    a.type === 'funds' ? (mode === 'add' ? 'funds' : 'cutFunds') : a.type === 'referral' ? (mode === 'add' ? 'referral' : 'cutReferral') : a.type
  const openAct = (type: ActType, user: AdminUser) => { setMode('add'); setAmount(''); setAct({ type, user }) }
  const run = async () => {
    if (!act) return
    const type = effType(act)
    const { user } = act
    const a = Number(amount)
    if ((type === 'funds' || type === 'referral' || type === 'cutFunds' || type === 'cutReferral') && !(a > 0)) return toast('Enter a valid amount', undefined, 'error')
    if (!live && type === 'cutFunds' && a > (kind === 'paid' ? state.balance : state.unpaid)) return toast('Amount is more than the current balance', undefined, 'error')
    if (!live && type === 'cutReferral' && a > state.referral.earned - state.referral.withdrawn) return toast('Amount is more than the available referral balance', undefined, 'error')
    if (type === 'cashback' && !(Number(pct) >= 0 && Number(pct) <= 100)) return toast('Percent must be 0–100', undefined, 'error')
    if (live) {
      const { error } =
        type === 'funds' ? await rpc('admin_credit', { p_email: user.email, p_amount: a, p_kind: kind })
        : type === 'referral' ? await rpc('admin_credit', { p_email: user.email, p_amount: a, p_kind: 'referral' })
        : type === 'cutFunds' ? await rpc('admin_debit', { p_email: user.email, p_amount: a, p_kind: kind })
        : type === 'cutReferral' ? await rpc('admin_debit', { p_email: user.email, p_amount: a, p_kind: 'referral' })
        : type === 'cashback' ? await rpc('admin_set_cashback', { p_code: user.code, p_percent: Number(pct) })
        : await rpc('admin_delete_user', { p_email: user.email })
      if (error) return toast('Failed', error === 'user_not_found' ? 'User not found (admins cannot be deleted here).' : error === 'insufficient' ? 'That is more than the user currently has. Enter a smaller amount.' : error, 'error')
    } else {
      if (type === 'funds' && isLocal(user.email)) s.adminCredit(kind, a)
      if (type === 'referral' && isLocal(user.email)) s.adminReferralEarning(a)
      if (type === 'cutFunds' && isLocal(user.email)) s.adminDebit(kind, a)
      if (type === 'cutReferral' && isLocal(user.email)) s.adminReferralEarning(-a)
      if (type === 'cashback') s.setCashback(user.code, Number(pct))
      if (type === 'delete' && isLocal(user.email)) s.deleteAccount()
    }
    toast('Done', type === 'delete' ? `${user.email} deleted` : type === 'cutFunds' || type === 'cutReferral' ? 'Amount deducted' : 'Saved')
    close()
    if (live) void load()
  }

  const saveOrderStatus = async () => {
    if (!orderAct) return
    const o = orderAct
    if (live) {
      const { error } = await rpc('admin_set_order_status', { p_id: Number(o.id), p_status: newStatus, p_refund: refund && newStatus === 'Canceled' })
      if (error) return toast('Failed', error, 'error')
    } else if (state.orders.some((x) => x.id === o.id)) s.adminSetOrderStatus(o.id, newStatus, refund)
    toast('Order updated', `${o.id} is now ${newStatus}`)
    setOrderAct(null)
    if (live) void load()
  }
  const savePayout = async () => {
    if (!payoutAct) return
    const { p, to } = payoutAct
    if (live) {
      const { error } = await rpc('admin_set_withdrawal_status', { p_id: p.id, p_status: to })
      if (error) return toast('Failed', error, 'error')
    } else {
      const local = p.localId ?? state.withdrawals.find((w) => w.amount === p.amount && w.status === 'Processing')?.id
      if (local && isLocal(p.email)) s.adminSetWithdrawalStatus(local, to)
    }
    toast(to === 'Paid' ? 'Marked as paid' : 'Payout rejected', to === 'Rejected' ? 'Amount returned to the user’s referral funds.' : undefined)
    setPayoutAct(null)
    if (live) void load()
  }
  const setTicket = async (t: AdminTicket, status: 'Open' | 'Resolved') => {
    if (live) {
      const { error } = await rpc('admin_set_ticket_status', { p_id: t.id, p_status: status })
      if (error) return toast('Failed', error, 'error')
    } else s.adminSetTicketStatus(t.id, status)
    toast(status === 'Resolved' ? 'Ticket resolved' : 'Ticket reopened', t.id)
    if (live) void load()
  }

  return (
    <div className="page adm">
      <div className="page-head">
        <div><span className="eyebrow">Admin</span><h1>Control panel</h1></div>
        <Link to="/" className="btn btn-ghost btn-sm"><ArrowLeft /> Site</Link>
      </div>
      <div className="adm-tabs"><Segmented label="Admin sections" options={(live ? TABS.filter((x) => x !== 'Demo') : TABS) as unknown as typeof TABS} value={tab} onChange={setTab} /></div>

      {tab === 'Users' && (
        <div className="stack">
          <div className="searchbox" style={{ minWidth: 0 }}><Search size={15} /><input placeholder="Search email or code" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          {shown.map((u) => (
            <div key={u.email} className="card card-pad adm-user">
              <div className="row"><span className="avatar">{(u.name || u.email).slice(0, 2).toUpperCase()}</span>
                <div className="grow"><b className="adm-email">{u.email}</b>
                  <div className="tiny faint">Code {u.code}{u.refBy ? ` · referred by ${u.refBy}` : ''} · {u.percent}% cashback · Wallet {formatINR(u.balance)} · Referral {formatINR(u.earned)}</div></div></div>
              <div className="adm-actions">
                <button type="button" className="btn btn-soft btn-sm" onClick={() => openAct('funds', u)}><Wallet /> Funds</button>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => openAct('referral', u)}><Gift /> Referral</button>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => { setPct(String(u.percent)); openAct('cashback', u) }}><Percent /> Cashback %</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => openAct('delete', u)}><Trash2 /> Delete</button>
              </div>
            </div>
          ))}
          {shown.length === 0 ? <div className="empty"><b>No users found</b></div> : null}
          <div className="card-title">{live ? 'Newest users' : 'Recent logins'}</div>
          {(live ? users.slice(0, 15).map((u) => [u.email, 'joined ' + timeAgo(String((remote?.users ?? []).find((x: any) => x.email === u.email)?.joined ?? ''))]) : state.logins.map((l) => [l.email, new Date(l.at).toLocaleString('en-IN')])).slice(0, 15).map((r: any[], i: number) => (
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
        {act && (() => {
          const type = effType(act)
          const money = act.type === 'funds' || act.type === 'referral'
          const cut = type === 'cutFunds' || type === 'cutReferral'
          return (
            <>
              <style>{ADM_SWITCH_CSS}</style>
              <ModalHead id="adm-t" title={act.type === 'funds' ? 'Wallet funds' : act.type === 'referral' ? 'Referral funds' : act.type === 'cashback' ? 'Affiliate percentage' : 'Delete user'} subtitle={act.user.email} onClose={close} />
              <div className="stack">
                {money && (
                  <div className="adm-switch" role="tablist" aria-label="Add or cut" data-active={mode}>
                    <span className="adm-switch-thumb" aria-hidden="true" />
                    <button type="button" role="tab" className="adm-switch-btn" aria-selected={mode === 'add'} onClick={() => setMode('add')}>Add</button>
                    <button type="button" role="tab" className="adm-switch-btn" aria-selected={mode === 'cut'} onClick={() => setMode('cut')}>Cut</button>
                  </div>
                )}
                {money && (
                  <input className="input" type="number" inputMode="decimal" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} />
                )}
                {act.type === 'funds' && (
                  <Segmented label={cut ? 'Deduct from' : 'Credit type'} options={['paid', 'unpaid'] as const} value={kind} onChange={setKind} />
                )}
                {type === 'funds' && <InfoBox><b>Paid</b> is real wallet money. <b>Unpaid</b> only places demo orders and is never withdrawable.</InfoBox>}
                {type === 'referral' && <InfoBox>Referral funds are the only balance the user can withdraw.</InfoBox>}
                {type === 'cutFunds' && <InfoBox warn>Removes the amount from the user’s <b>{kind === 'paid' ? 'paid wallet' : 'unpaid (demo) credit'}</b>. It cannot go below ₹0.</InfoBox>}
                {type === 'cutReferral' && <InfoBox warn>Removes the amount from the user’s referral / cashback earnings. Only what is still withdrawable can be cut.</InfoBox>}
                {act.type === 'cashback' && (
                  <>
                    <input className="input" type="number" inputMode="decimal" placeholder="Percent" value={pct} onChange={(e) => setPct(e.target.value)} />
                    <InfoBox>Applies to code <b>{act.user.code}</b> from the next top-up of anyone who joins with it.</InfoBox>
                  </>
                )}
                {act.type === 'delete' && <InfoBox warn>This removes the account and cannot be undone.</InfoBox>}
                <button className={`btn ${act.type === 'delete' || cut ? 'btn-danger' : 'btn-primary'} btn-block`} type="button" onClick={run}>
                  {act.type === 'delete' ? 'Delete user' : cut ? 'Deduct' : money ? 'Add' : 'Save'}
                </button>
              </div>
            </>
          )
        })()}
      </Modal>
      <p className="tiny faint" style={{ marginTop: 18 }}>Paid wallet total shown to user: {formatINR(state.balance)}</p>
    </div>
  )
}
