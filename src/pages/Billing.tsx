import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Banknote, Crown, Landmark, Plus, RotateCcw, ShoppingBag, Wallet } from 'lucide-react'
import { useStore } from '../lib/store'
import { formatINR, timeAgo } from '../lib/data'
import { Segmented } from '../components/ui'

const TABS = ['All', 'Payments', 'Withdrawals'] as const
type Tab = (typeof TABS)[number]

interface Row {
  id: string
  kind: 'payment' | 'withdrawal'
  icon: ReactNode
  title: string
  sub: string
  amount: number
  sign: '+' | '-'
  status?: string
  at: string
}

const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

export default function Billing() {
  const { state } = useStore()
  const [tab, setTab] = useState<Tab>('All')

  useEffect(() => { document.title = 'Payments & withdrawals — UGrowSMM' }, [])

  const rows = useMemo<Row[]>(() => {
    const pay: Row[] = state.transactions.map((t) => {
      const plus = t.type === 'deposit' || t.type === 'refund'
      const isPro = t.label.startsWith('Pro membership')
      return {
        id: 'p' + t.id + t.createdAt,
        kind: 'payment',
        icon: isPro ? <Crown /> : t.type === 'deposit' ? <Wallet /> : t.type === 'refund' ? <RotateCcw /> : t.type === 'order' ? <ShoppingBag /> : <Wallet />,
        title: t.label || (t.type === 'deposit' ? 'Wallet top-up' : 'Payment'),
        sub: `${t.id}${t.method ? ' · ' + t.method : ''}`,
        amount: t.amount,
        sign: plus ? '+' : '-',
        at: t.createdAt,
      }
    })
    const wd: Row[] = state.withdrawals.map((w) => ({
      id: 'w' + w.id,
      kind: 'withdrawal',
      icon: <Banknote />,
      title: `Withdrawal to ${w.method}`,
      sub: `${w.id} · ${w.details}`,
      amount: w.amount,
      sign: '-',
      status: w.status,
      at: w.createdAt,
    }))
    return [...pay, ...wd].sort((a, b) => b.at.localeCompare(a.at))
  }, [state.transactions, state.withdrawals])

  const shown = rows.filter((r) => (tab === 'All' ? true : tab === 'Payments' ? r.kind === 'payment' : r.kind === 'withdrawal'))
  const added = state.transactions.filter((t) => t.type === 'deposit').reduce((s, t) => s + t.amount, 0)
  const spent = state.transactions.filter((t) => t.type === 'order').reduce((s, t) => s + t.amount, 0)
  const withdrawn = state.withdrawals.filter((w) => w.status !== 'Rejected').reduce((s, w) => s + w.amount, 0)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Billing</span>
          <h1>Payments &amp; withdrawals</h1>
          <p>Every top-up, order payment, Pro payment and withdrawal in one place.</p>
        </div>
        <div className="row wrap" style={{ gap: 10 }}>
          <Link to="/add-funds" className="btn btn-ghost"><Plus /> Add funds</Link>
          <Link to="/referral" className="btn btn-primary"><Landmark /> Withdraw</Link>
        </div>
      </div>

      <div className="stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        <div className="stat"><div className="stat-top">Added to wallet <span className="icon"><Wallet /></span></div><div className="stat-value">{formatINR(added)}</div></div>
        <div className="stat"><div className="stat-top">Spent <span className="icon"><ShoppingBag /></span></div><div className="stat-value">{formatINR(spent)}</div></div>
        <div className="stat"><div className="stat-top">Withdrawn <span className="icon"><Banknote /></span></div><div className="stat-value">{formatINR(withdrawn)}</div></div>
      </div>

      <div className="section stack">
        <div className="adm-tabs"><Segmented label="History type" options={TABS} value={tab} onChange={setTab} /></div>
        <div className="card card-pad bill-list">
          {shown.length === 0 ? (
            <div className="empty">
              <b>{tab === 'Withdrawals' ? 'No withdrawals yet' : 'No payments yet'}</b>
              <span>{tab === 'Withdrawals' ? 'Your referral withdrawals will show here.' : 'Your top-ups and order payments will show here.'}</span>
            </div>
          ) : shown.map((r) => (
            <div className="bill-row" key={r.id}>
              <span className={`bill-ic ${r.kind}`}>{r.icon}</span>
              <div className="bill-main">
                <div className="bill-title">{r.title}</div>
                <div className="bill-sub">{when(r.at)} · {timeAgo(r.at)}</div>
                <div className="bill-sub bill-id">{r.sub}</div>
              </div>
              <div className="bill-right">
                <b className={r.sign === '+' ? 'plus' : 'minus'}>{r.sign}{formatINR(r.amount)}</b>
                {r.status ? <span className={`badge ${r.status === 'Paid' ? 'badge-green' : r.status === 'Rejected' ? 'badge-red' : 'badge-amber'}`}>{r.status}</span> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
