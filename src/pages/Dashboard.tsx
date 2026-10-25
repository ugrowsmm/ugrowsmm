import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  CreditCard,
  Gift,
  KeyRound,
  ListOrdered,
  Plus,
  Rocket,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react'
import { REFERRAL_PERCENT_DEFAULT, useStore } from '../lib/store'
import {
  CHART_LABELS,
  CHART_POINTS,
  PLATFORM_LABEL,
  SERVICES,
  formatCompact,
  formatINR,
  timeAgo,
  type Order,
} from '../lib/data'
import { PlatformIcon } from '../components/PlatformIcon'
import { AreaChart, ProgressRing, StatusBadge, useCountUp } from '../components/ui'
import { useState } from 'react'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function ActiveOrderRow({ order }: { order: Order }) {
  return (
    <Link
      to="/orders"
      className="row"
      style={{ padding: '12px 0', borderTop: '1px solid var(--line)', gap: 12 }}
    >
      <span className={`platform-tile ${order.platform}`} style={{ width: 36, height: 36 }}>
        <PlatformIcon platform={order.platform} size={16} />
      </span>
      <div className="grow" style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {order.serviceName}
        </div>
        <div className="order-sub">
          <span>{order.quantity.toLocaleString('en-IN')} units</span>
          <span className="sep" />
          <span className="link">{order.link}</span>
        </div>
      </div>
      <div className="hide-mobile" style={{ width: 88 }}>
        <div className="order-progress">
          <div className="bar">
            <i style={{ width: `${order.progress}%` }} />
          </div>
        </div>
      </div>
      <ProgressRing percent={order.progress} size={34} />
    </Link>
  )
}

export default function Dashboard() {
  const { state } = useStore()
  const navigate = useNavigate()
  const [range, setRange] = useState<'7D' | '14D'>('14D')
  const balance = useCountUp(state.balance)

  const activeOrders = state.orders.filter(
    (o) => o.status === 'In progress' || o.status === 'Pending',
  )
  const completed = state.orders.filter((o) => o.status === 'Completed').length
  const spent = state.transactions
    .filter((t) => t.type === 'order')
    .reduce((sum, t) => sum + t.amount, 0)
  const topUps = state.transactions
    .filter((t) => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0)

  const chartData = range === '7D' ? CHART_POINTS.slice(-7) : CHART_POINTS
  const chartLabels = range === '7D' ? CHART_LABELS.slice(-7) : CHART_LABELS
  const totalSpend = chartData.reduce((a, b) => a + b, 0)

  const trending = SERVICES.filter((s) => s.badge).slice(0, 3)
  const recentTx = state.transactions.slice(0, 5)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">
            <Sparkles size={12} /> {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <h1>
            {greeting()}, {state.profile.name.split(' ')[0]}
          </h1>
          <p>Your growth engine is warm. Here’s how every account is performing today.</p>
        </div>
        <div className="row wrap" style={{ gap: 10 }}>
          <Link to="/add-funds" className="btn btn-ghost">
            <Wallet /> Add funds
          </Link>
          <Link to="/new-order" className="btn btn-primary">
            <Plus /> New order
          </Link>
        </div>
      </div>

      <div className="grid-2">
        <div className="hero-balance">
          <div className="between" style={{ alignItems: 'flex-start' }}>
            <div>
              <div className="label">
                <Wallet size={13} /> Available balance
              </div>
              <div className="amount mono">
                {formatINR(balance).replace('.00', '')}
              </div>
              <div className="meta">Ready for all {SERVICES.length} services · auto-refill off</div>
            </div>
            <span className="badge badge-lime" style={{ marginTop: 4 }}>
              <Zap /> Active
            </span>
          </div>

          <div className="hero-actions">
            <Link to="/add-funds" className="btn btn-lime">
              <Plus /> Top up wallet
            </Link>
            <Link to="/orders" className="btn btn-ghost">
              <ListOrdered /> Track orders
            </Link>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 22,
              marginTop: 26,
              paddingTop: 18,
              borderTop: '1px solid rgba(16, 24, 40, 0.1)',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '#5b6472', fontWeight: 700 }}>
                LIFETIME TOP-UP
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, marginTop: 3 }}>
                {formatINR(topUps, 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '#5b6472', fontWeight: 700 }}>
                SPENT
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, marginTop: 3 }}>
                {formatINR(spent, 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '#5b6472', fontWeight: 700 }}>
                SAVED VS AGENCY
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, marginTop: 3, color: '#047857' }}>
                {formatINR(18400, 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="hero-side">
          <div className="mini-metric">
            <span className="icon">
              <TrendingUp />
            </span>
            <div>
              <div className="v">
                +{formatCompact(12840)}
              </div>
              <div className="k">Followers gained this week</div>
            </div>
            <span className="stat-delta" style={{ marginLeft: 'auto' }}>
              <ArrowUpRight /> 18.2%
            </span>
          </div>
          <div className="mini-metric">
            <span className="icon cyan">
              <Zap />
            </span>
            <div>
              <div className="v">98.4%</div>
              <div className="k">On-time delivery score</div>
            </div>
          </div>
          <div className="mini-metric">
            <span className="icon lime">
              <Clock />
            </span>
            <div>
              <div className="v">42 min</div>
              <div className="k">Average start time</div>
            </div>
            <span className="badge badge-green" style={{ marginLeft: 'auto' }}>
              Fast
            </span>
          </div>
        </div>
      </div>

      <div className="stats section">
        <div className="stat">
          <div className="stat-top">
            <span>Active orders</span>
            <span className="icon">
              <Rocket />
            </span>
          </div>
          <div className="stat-value">{activeOrders.length}</div>
          <span className="tiny faint">Across {new Set(activeOrders.map((o) => o.platform)).size} platforms</span>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span>Completed</span>
            <span className="icon">
              <ListOrdered />
            </span>
          </div>
          <div className="stat-value">{completed}</div>
          <span className="tiny faint">Delivered, all time</span>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span>Total spent</span>
            <span className="icon">
              <CreditCard />
            </span>
          </div>
          <div className="stat-value">{formatINR(spent, 0)}</div>
          <span className="tiny faint">Lifetime, all services</span>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span>Avg. delivery</span>
            <span className="icon">
              <Clock />
            </span>
          </div>
          <div className="stat-value">42m</div>
          <span className="stat-delta">
            <ArrowUpRight /> 9% faster
          </span>
        </div>
      </div>

      <div className="grid-2 section">
        <div className="card card-pad">
          <div className="between" style={{ marginBottom: 20 }}>
            <div>
              <div className="card-title">Spend overview</div>
              <div className="tiny faint" style={{ marginTop: 3 }}>
                {formatINR(totalSpend, 0)} across the last {range === '7D' ? '7' : '14'} days
              </div>
            </div>
            <div className="segmented">
              {(['7D', '14D'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={range === r ? 'active' : ''}
                  onClick={() => setRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <AreaChart data={chartData} labels={chartLabels} height={210} />
          <div className="legend" style={{ marginTop: 26 }}>
            <span>
              <i /> Daily spend
            </span>
            <span>
              <i className="cyan" /> Delivery value
            </span>
            <span style={{ marginLeft: 'auto' }} className="hide-mobile">
              Hover the chart to inspect a day
            </span>
          </div>
        </div>

        <div className="card card-pad">
          <div className="card-head">
            <div>
              <div className="card-title">Quick actions</div>
              <div className="tiny faint" style={{ marginTop: 3 }}>
                Everything one tap away
              </div>
            </div>
          </div>
          <div className="quick-actions">
            <button className="quick-action" type="button" onClick={() => navigate('/new-order')}>
              <span className="qa-icon">
                <Plus />
              </span>
              <span>
                <span className="t">Place a new order</span>
                <span className="d">{SERVICES.length} services · instant start</span>
              </span>
              <ArrowRight />
            </button>
            <button className="quick-action" type="button" onClick={() => navigate('/add-funds')}>
              <span className="qa-icon lime">
                <Wallet />
              </span>
              <span>
                <span className="t">Top up your wallet</span>
                <span className="d">PhonePe, GPay, Paytm & BHIM</span>
              </span>
              <ArrowRight />
            </button>
            <button className="quick-action" type="button" onClick={() => navigate('/api')}>
              <span className="qa-icon cyan">
                <KeyRound />
              </span>
              <span>
                <span className="t">Manage API key</span>
                <span className="d">Automate your orders</span>
              </span>
              <ArrowRight />
            </button>
            <button className="quick-action" type="button" onClick={() => navigate('/referral')}>
              <span className="qa-icon">
                <Gift />
              </span>
              <span>
                <span className="t">Refer &amp; earn</span>
                <span className="d">
                  Earn {state.codePercents[state.referral.code] ?? REFERRAL_PERCENT_DEFAULT}% of every top-up
                </span>
              </span>
              <ArrowRight />
            </button>
          </div>

        </div>
      </div>

      <div className="grid-2 section">
        <div className="card card-pad">
          <div className="card-head">
            <div>
              <div className="card-title">Live orders</div>
              <div className="tiny faint" style={{ marginTop: 3 }}>
                {activeOrders.length} in progress right now
              </div>
            </div>
            <Link to="/orders" className="text-btn">
              View all <ArrowUpRight />
            </Link>
          </div>
          {activeOrders.slice(0, 3).map((order) => (
            <ActiveOrderRow key={order.id} order={order} />
          ))}
          {activeOrders.length === 0 ? (
            <div className="empty" style={{ padding: '28px 10px' }}>
              No live orders — start one in seconds.
            </div>
          ) : null}
        </div>

        <div className="card card-pad">
          <div className="card-head">
            <div>
              <div className="card-title">Recent activity</div>
              <div className="tiny faint" style={{ marginTop: 3 }}>
                Wallet movements
              </div>
            </div>
            <Link to="/add-funds" className="text-btn">
              Wallet <ArrowUpRight />
            </Link>
          </div>
          <div className="activity">
            {recentTx.map((tx) => (
              <div className="activity-row" key={tx.id}>
                <span className={`dot ${tx.type === 'deposit' ? 'green' : tx.type === 'refund' ? 'cyan' : ''}`} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="t" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.label}
                  </div>
                  <div className="w">
                    {timeAgo(tx.createdAt)}
                    {tx.method ? ` · ${tx.method}` : ''}
                  </div>
                </div>
                <span
                  className="amt"
                  style={{
                    color: tx.type === 'deposit' ? '#047857' : tx.type === 'refund' ? '#0369a1' : '#344054',
                  }}
                >
                  {tx.type === 'deposit' ? '+' : tx.type === 'refund' ? '+' : '−'}
                  {formatINR(tx.amount, 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="between" style={{ marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 18 }}>Trending services</h2>
            <div className="tiny faint" style={{ marginTop: 3 }}>
              Most ordered this week by creators like you
            </div>
          </div>
          <Link to="/services" className="text-btn">
            All services <ArrowRight />
          </Link>
        </div>
        <div className="service-grid">
          {trending.map((service) => (
            <button
              key={service.id}
              type="button"
              className="service-card"
              onClick={() => navigate(`/new-order?service=${service.id}`)}
            >
              <div className="top">
                <span className={`platform-tile ${service.platform}`}>
                  <PlatformIcon platform={service.platform} />
                </span>
                <span className="badge badge-lime">{service.badge}</span>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: '#5b6472', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {PLATFORM_LABEL[service.platform]}
                </div>
                <div className="name">{service.name}</div>
                <div className="cat">{service.description}</div>
              </div>
              <div className="service-meta-row">
                <span>Min {service.min.toLocaleString('en-IN')}</span>
                <span>·</span>
                <span>{service.avgTime}</span>
              </div>
              <div className="bottom">
                <div className="rate">
                  {formatINR(service.rate, 0)} <span>/ 1k</span>
                </div>
                <span className="badge badge-violet">
                  Order <ArrowUpRight />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div
        className="between wrap"
        style={{
          marginTop: 28,
          paddingTop: 18,
          borderTop: '1px solid var(--line)',
          fontSize: 11,
          color: 'var(--faint)',
        }}
      >
        <span>Built for creators, agencies & resellers</span>
        <span className="row" style={{ gap: 14 }}>
          <StatusBadge status="In progress" />
          <span>All delivery systems operational</span>
        </span>
      </div>
    </div>
  )
}
