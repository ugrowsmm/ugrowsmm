import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  CheckCircle2,
  Code2,
  Copy,
  Eye,
  EyeOff,
  Gauge,
  Info,
  KeyRound,
  Lock,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { CopyButton, InfoBox, Modal, Switch, copyText } from '../components/ui'

const ENDPOINTS = [
  { method: 'POST', path: '/v2/order', desc: 'Create a new order' },
  { method: 'GET', path: '/v2/order/{id}', desc: 'Poll order status' },
  { method: 'GET', path: '/v2/services', desc: 'List services & rates' },
  { method: 'GET', path: '/v2/balance', desc: 'Check wallet balance' },
]

export default function ApiPage() {
  const { state, regenerateKey, toggleApi, toast } = useStore()
  const [show, setShow] = useState(false)
  const [tab, setTab] = useState<'cURL' | 'JavaScript' | 'PHP'>('cURL')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [newKey, setNewKey] = useState('')

  const masked = `${state.apiKey.slice(0, 12)}${'•'.repeat(16)}${state.apiKey.slice(-4)}`
  const display = show ? state.apiKey : masked

  const snippets: Record<string, string> = {
    cURL: `curl -X POST https://api.ugrowsmm.in/v2/order \\
  -H "Authorization: Bearer ${state.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "service": "ig-followers",
    "link": "https://instagram.com/your.profile",
    "quantity": 1000
  }'`,
    JavaScript: `const res = await fetch('https://api.ugrowsmm.in/v2/order', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ${state.apiKey}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    service: 'ig-followers',
    link: 'https://instagram.com/your.profile',
    quantity: 1000,
  }),
})

const order = await res.json()
console.log(order.id, order.status)`,
    PHP: `<?php
$ch = curl_init('https://api.ugrowsmm.in/v2/order');

curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    'Authorization: Bearer ${state.apiKey}',
    'Content-Type: application/json',
  ],
  CURLOPT_POSTFIELDS => json_encode([
    'service'  => 'ig-followers',
    'link'     => 'https://instagram.com/your.profile',
    'quantity' => 1000,
  ]),
]);

$order = json_decode(curl_exec($ch), true);
echo $order['id'];`,
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">
            <Code2 size={12} /> Developer platform
          </span>
          <h1>Automate everything</h1>
          <p>Create orders, poll delivery and pull balances from your own stack with the v2 API.</p>
        </div>
        <span className={`badge ${state.apiEnabled ? 'badge-green' : 'badge-red'}`} style={{ height: 30, padding: '0 12px' }}>
          <Activity /> {state.apiEnabled ? 'API operational' : 'API paused'}
        </span>
      </div>

      <div className="grid-3 stats-tight" style={{ marginBottom: 16 }}>
        <div className="stat">
          <div className="stat-top">
            <span>Requests this month</span>
            <span className="icon">
              <Activity />
            </span>
          </div>
          <div className="stat-value">12,480</div>
          <span className="tiny faint">of 50,000 included</span>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span>Success rate</span>
            <span className="icon">
              <ShieldCheck />
            </span>
          </div>
          <div className="stat-value">99.98%</div>
          <span className="stat-delta">
            <CheckCircle2 /> Healthy
          </span>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span>Avg. response</span>
            <span className="icon">
              <Gauge />
            </span>
          </div>
          <div className="stat-value">142ms</div>
          <span className="tiny faint">Global edge network</span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <div className="card-head">
            <div>
              <div className="card-title">Live API key</div>
              <div className="tiny faint" style={{ marginTop: 3 }}>
                Created 12 Feb 2026 · full access
              </div>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Hide API key' : 'Reveal API key'}
              title={show ? 'Hide key' : 'Reveal key'}
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <div className="api-key-box">
            <KeyRound size={15} style={{ color: '#9a3412', flexShrink: 0 }} />
            <code>{display}</code>
            <div className="actions">
              <CopyButton
                text={state.apiKey}
                onCopied={() => toast('API key copied', 'Keep it secret — never commit it to code.', 'info')}
              />
            </div>
          </div>

          <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-soft btn-sm"
              onClick={() => setConfirmOpen(true)}
            >
              <RefreshCw /> Regenerate key
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => copyText(snippets.cURL).then(() => toast('cURL copied', 'Paste it into your terminal.', 'info'))}
            >
              <Copy /> Copy cURL
            </button>
            <span className="pill" style={{ marginLeft: 'auto' }}>
              <Lock size={10} /> SHA-256 stored
            </span>
          </div>

          <div className="switch-row" style={{ marginTop: 16, paddingBottom: 0 }}>
            <div>
              <div className="t">API access</div>
              <div className="d">Pause instantly without deleting your key.</div>
            </div>
            <Switch
              on={state.apiEnabled}
              onChange={() => {
                toggleApi()
                toast(
                  state.apiEnabled ? 'API paused' : 'API enabled',
                  state.apiEnabled
                    ? 'All requests will return 403 until you re-enable.'
                    : 'Your key is live again.',
                  'info',
                )
              }}
              label="Toggle API access"
            />
          </div>
        </div>

        <div className="card card-pad">
          <div className="card-head">
            <div>
              <div className="card-title">Usage & limits</div>
              <div className="tiny faint" style={{ marginTop: 3 }}>
                Resets on 1 November
              </div>
            </div>
            <span className="badge badge-cyan">v2</span>
          </div>

          <div className="between" style={{ fontSize: 12 }}>
            <span className="muted">Monthly requests</span>
            <b>12,480 / 50,000</b>
          </div>
          <div className="usage-bar">
            <i style={{ width: '25%' }} />
          </div>

          <div className="dashed-divider" />

          <div className="summary-line">
            <span>Rate limit</span>
            <b>120 req / min</b>
          </div>
          <div className="summary-line">
            <span>Burst allowance</span>
            <b>300 req</b>
          </div>
          <div className="summary-line">
            <span>Webhook events</span>
            <b>order.completed, order.canceled</b>
          </div>
          <div className="summary-line">
            <span>Environment</span>
            <b>Production</b>
          </div>

          <div style={{ marginTop: 14 }}>
            <InfoBox>
              Never expose your key in front-end code. Rotate it immediately if you suspect a leak.
            </InfoBox>
          </div>
        </div>
      </div>

      <div className="grid-2 section">
        <div className="card card-pad">
          <div className="card-head">
            <div>
              <div className="card-title">Quickstart</div>
              <div className="tiny faint" style={{ marginTop: 3 }}>
                Create your first order in one request
              </div>
            </div>
            <Terminal size={15} style={{ color: '#5b6472' }} />
          </div>

          <div className="code-tabs" role="tablist" aria-label="Code language">
            {(['cURL', 'JavaScript', 'PHP'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={`code-tab ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="code-block">
            <button
              type="button"
              className="copy-btn code-copy"
              aria-label="Copy code sample"
              onClick={() => copyText(snippets[tab]).then(() => toast('Code copied', `${tab} snippet is on your clipboard.`, 'info'))}
            >
              <Copy />
            </button>
            <pre>{snippets[tab]}</pre>
          </div>

          <div className="tiny faint" style={{ marginTop: 12, lineHeight: 1.6 }}>
            Every response returns JSON with <code style={{ color: '#9a3412' }}>id</code>,{' '}
            <code style={{ color: '#9a3412' }}>status</code>, and <code style={{ color: '#9a3412' }}>charge</code>.
            Use idempotency keys for safe retries.
          </div>
        </div>

        <div className="card card-pad">
          <div className="card-head">
            <div>
              <div className="card-title">Endpoints</div>
              <div className="tiny faint" style={{ marginTop: 3 }}>
                Base URL · api.ugrowsmm.in
              </div>
            </div>
            <Server size={15} style={{ color: '#5b6472' }} />
          </div>

          {ENDPOINTS.map((endpoint) => (
            <div className="endpoint" key={endpoint.path}>
              <span className={`method ${endpoint.method === 'POST' ? 'post' : ''}`}>
                {endpoint.method}
              </span>
              <code>{endpoint.path}</code>
              <span className="desc hide-mobile">{endpoint.desc}</span>
            </div>
          ))}

          <div className="dashed-divider" />

          <div className="row" style={{ gap: 10 }}>
            <span className="qa-icon lime">
              <Zap size={14} />
            </span>
            <div className="grow">
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>Need a sandbox key?</div>
              <div className="tiny faint">Test freely without spending wallet balance.</div>
            </div>
            <button
              type="button"
              className="text-btn"
              onClick={() =>
                toast('Sandbox access requested', 'Demo UI — a real key would be emailed to you.', 'info')
              }
            >
              Request
            </button>
          </div>

          <Link to="/settings" className="text-btn" style={{ marginTop: 14 }}>
            <Info /> Review account security
          </Link>
        </div>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} labelledBy="regen-title">
        <div className="modal-icon danger">
          <RefreshCw />
        </div>
        <h2 id="regen-title">Regenerate API key?</h2>
        <p className="sub">
          Your current key stops working immediately. Every integration using it will need the new
          key.
        </p>
        <InfoBox warn>
          This can’t be undone. Copy the new key before closing the next dialog.
        </InfoBox>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              const key = regenerateKey()
              setNewKey(key)
              setConfirmOpen(false)
              setShow(true)
              toast('New API key generated', 'Update your integrations with the new key.', 'success')
            }}
          >
            <RefreshCw /> Regenerate
          </button>
        </div>
      </Modal>

      <Modal open={newKey !== ''} onClose={() => setNewKey('')} labelledBy="new-key-title">
        <div className="modal-icon success">
          <KeyRound />
        </div>
        <h2 id="new-key-title">Your new key is ready</h2>
        <p className="sub">This is the only time we’ll show it in full. Store it somewhere safe.</p>
        <div className="api-key-box" style={{ marginTop: 16 }}>
          <code>{newKey}</code>
          <div className="actions">
            <CopyButton
              text={newKey}
              onCopied={() => toast('Copied', 'New API key copied to clipboard.', 'info')}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-primary btn-block" onClick={() => setNewKey('')}>
            I’ve saved it
          </button>
        </div>
      </Modal>
    </div>
  )
}
