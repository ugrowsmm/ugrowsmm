import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Copy,
  Download,
  Filter,
  ListOrdered,
  Plus,
  Search,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useStore } from '../lib/store'
import {
  formatDate,
  formatINR,
  timeAgo,
  type Order,
  type OrderStatus,
} from '../lib/data'
import { PlatformIcon } from '../components/PlatformIcon'
import {
  CopyButton,
  EmptyState,
  Modal,
  ModalHead,
  ProgressRing,
  SecureNote,
  StatusBadge,
} from '../components/ui'

type FilterKey = 'All' | OrderStatus

const FILTERS: FilterKey[] = ['All', 'Pending', 'In progress', 'Completed', 'Partial', 'Canceled']

export default function Orders() {
  const { state, toast } = useStore()
  const [filter, setFilter] = useState<FilterKey>('All')
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<Order | null>(null)

  const counts = useMemo(
    () => ({
      All: state.orders.length,
      'In progress': state.orders.filter((o) => o.status === 'In progress').length,
      Completed: state.orders.filter((o) => o.status === 'Completed').length,
      Partial: state.orders.filter((o) => o.status === 'Partial').length,
      Canceled: state.orders.filter((o) => o.status === 'Canceled').length,
      Pending: state.orders.filter((o) => o.status === 'Pending').length,
    }),
    [state.orders],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.orders
      .filter((o) => filter === 'All' || o.status === filter)
      .filter(
        (o) =>
          !q ||
          o.id.toLowerCase().includes(q) ||
          o.serviceName.toLowerCase().includes(q) ||
          o.link.toLowerCase().includes(q),
      )
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [state.orders, filter, query])

  const lifetime = state.orders
    .filter((o) => o.status !== 'Canceled')
    .reduce((sum, o) => sum + o.charge, 0)

  const exportCsv = () => {
    const rows = [
      ['Order ID', 'Service', 'Link', 'Quantity', 'Charge (INR)', 'Status', 'Placed'],
      ...visible.map((o) => [
        o.id,
        o.serviceName,
        o.link,
        String(o.quantity),
        String(o.charge),
        o.status,
        new Date(o.createdAt).toISOString(),
      ]),
    ]
    // a cell that starts with = + - @ would run as a formula when opened in Excel: park it behind an apostrophe
    const safe = (cell: string) => (/^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell)
    const csv = rows
      .map((row) => row.map((cell) => `"${safe(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ugrowsmm-orders-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast('Export ready', `${visible.length} orders downloaded as CSV.`, 'info')
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">
            <ListOrdered size={12} /> Order history
          </span>
          <h1>Every order, tracked live</h1>
          <p>Follow delivery in real time, reorder favourites, and download clean reports.</p>
        </div>
        <div className="row wrap" style={{ gap: 10 }}>
          <button type="button" className="btn btn-ghost" onClick={exportCsv} disabled={!visible.length}>
            <Download /> Export CSV
          </button>
          <Link to="/new-order" className="btn btn-primary">
            <Plus /> New order
          </Link>
        </div>
      </div>

      <div className="grid-4 stats-tight" style={{ marginBottom: 18 }}>
        <div className="stat">
          <div className="stat-top">
            <span>Total orders</span>
            <span className="icon">
              <ShoppingBag />
            </span>
          </div>
          <div className="stat-value">{state.orders.length}</div>
          <span className="tiny faint">All time</span>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span>In delivery</span>
            <span className="icon">
              <TrendingUp />
            </span>
          </div>
          <div className="stat-value">{counts['In progress']}</div>
          <span className="tiny faint">Live right now</span>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span>Completed</span>
            <span className="icon">
              <ListOrdered />
            </span>
          </div>
          <div className="stat-value">{counts.Completed}</div>
          <span className="tiny faint">100% delivered</span>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span>Lifetime value</span>
            <span className="icon">
              <Wallet />
            </span>
          </div>
          <div className="stat-value">{formatINR(lifetime, 0)}</div>
          <span className="tiny faint">Excluding refunds</span>
        </div>
      </div>

      <div className="filter-bar">
        <div className="searchbox">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order ID, service or link…"
            aria-label="Search orders"
          />
        </div>
        <div className="segmented" role="tablist" aria-label="Filter orders by status">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              className={filter === f ? 'active' : ''}
              onClick={() => setFilter(f)}
            >
              {f}
              <span style={{ opacity: 0.55, marginLeft: 5, fontSize: 9.5 }}>{counts[f]}</span>
            </button>
          ))}
        </div>
        <span className="pill hide-mobile" style={{ marginLeft: 'auto' }}>
          <Filter size={10} /> {visible.length} shown
        </span>
      </div>

      <div className="order-list">
        {visible.map((order) => (
          <div
            key={order.id}
            className="order-card"
            role="button"
            tabIndex={0}
            onClick={() => setActive(order)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setActive(order)
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="order-main">
              <span className={`platform-tile ${order.platform}`}>
                <PlatformIcon platform={order.platform} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="order-title">{order.serviceName}</div>
                <div className="order-sub">
                  <span>#{order.id}</span>
                  <span className="sep" />
                  <span>{order.quantity.toLocaleString('en-IN')} units</span>
                  <span className="sep" />
                  <span className="link">{order.link}</span>
                </div>
              </div>
            </div>

            <div className="order-progress">
              <div className="between" style={{ marginBottom: 5 }}>
                <StatusBadge status={order.status} />
                <span className="tiny faint">{order.progress}%</span>
              </div>
              <div className="bar">
                <i
                  style={{
                    width: `${order.progress}%`,
                    opacity: order.status === 'Canceled' ? 0.35 : 1,
                  }}
                />
              </div>
              <div className="pmeta">
                <span>{timeAgo(order.createdAt)}</span>
                <span>{order.status === 'Completed' ? 'Delivered' : `${order.quantity - Math.round((order.quantity * order.progress) / 100)} left`}</span>
              </div>
            </div>

            <div className="order-right">
              <div className="price">{formatINR(order.charge)}</div>
              <div className="oid">
                {formatDate(order.createdAt)}
                {order.dripfeed ? ' · drip' : ''}
              </div>
              <div className="row hide-mobile" style={{ gap: 6, justifyContent: 'flex-end', marginTop: 7 }}>
                <span className="badge badge-violet" style={{ height: 22 }}>
                  View <ArrowRight style={{ width: 10, height: 10 }} />
                </span>
              </div>
            </div>
          </div>
        ))}

        {visible.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<ShoppingBag />}
              title={state.orders.length ? 'No orders match this filter' : 'No orders yet'}
              body={
                state.orders.length
                  ? 'Try clearing the search or switching tabs to see the rest of your history.'
                  : 'Your first campaign is one click away. Pick a service and drop your link.'
              }
              action={
                <Link to="/new-order" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                  <Plus /> Create an order
                </Link>
              }
            />
          </div>
        ) : null}
      </div>

      <div className="card card-pad" style={{ marginTop: 18 }}>
        <div className="between wrap" style={{ gap: 12 }}>
          <div className="row" style={{ gap: 12 }}>
            <span className="qa-icon cyan">
              <Copy size={14} />
            </span>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>Automate these orders with the API</div>
              <div className="tiny faint">Push orders programmatically and poll status in real time.</div>
            </div>
          </div>
          <Link to="/api" className="btn btn-soft btn-sm">
            API docs <ArrowRight />
          </Link>
        </div>
      </div>

      <Modal open={active !== null} onClose={() => setActive(null)} labelledBy="order-detail" width={520}>
        {active ? (
          <>
            <ModalHead
              id="order-detail"
              title={`Order #${active.id}`}
              subtitle={`Placed ${formatDate(active.createdAt)} · ${timeAgo(active.createdAt)}`}
              onClose={() => setActive(null)}
            />
            <div className="row" style={{ gap: 12, marginBottom: 16 }}>
              <span className={`platform-tile ${active.platform}`} style={{ width: 44, height: 44 }}>
                <PlatformIcon platform={active.platform} size={19} />
              </span>
              <div className="grow">
                <div style={{ fontSize: 14, fontWeight: 700 }}>{active.serviceName}</div>
                <div className="tiny faint">{active.link}</div>
              </div>
              <ProgressRing percent={active.progress} size={46} stroke={4} />
            </div>

            <div
              style={{
                padding: '2px 14px',
                borderRadius: 14,
                border: '1px solid var(--line)',
                background: 'rgba(16, 24, 40, 0.025)',
              }}
            >
              <div className="detail-row">
                <span className="k">Status</span>
                <span className="v">
                  <StatusBadge status={active.status} />
                </span>
              </div>
              <div className="detail-row">
                <span className="k">Quantity</span>
                <span className="v">{active.quantity.toLocaleString('en-IN')} units</span>
              </div>
              <div className="detail-row">
                <span className="k">Start count</span>
                <span className="v">{active.startCount.toLocaleString('en-IN')}</span>
              </div>
              <div className="detail-row">
                <span className="k">Charge</span>
                <span className="v">{formatINR(active.charge)}</span>
              </div>
              <div className="detail-row">
                <span className="k">Drip-feed</span>
                <span className="v">{active.dripfeed ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="detail-row">
                <span className="k">Target link</span>
                <span className="v row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{active.link}</span>
                  <CopyButton text={`https://${active.link}`} label="Copy link" />
                </span>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(active.id)
                    toast('Order ID copied', `${active.id} is on your clipboard.`, 'info')
                  } catch {
                    toast('Copy failed', 'Select the order ID manually.', 'error')
                  }
                }}
              >
                <Copy /> Copy ID
              </button>
              <Link
                to={`/new-order?service=${active.serviceId}`}
                className="btn btn-primary"
                onClick={() => setActive(null)}
              >
                Reorder <ArrowRight />
              </Link>
            </div>
            <SecureNote />
          </>
        ) : null}
      </Modal>
    </div>
  )
}
