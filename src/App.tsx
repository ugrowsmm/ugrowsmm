import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CheckCircle2, Download, Info, XCircle } from 'lucide-react'
import { StoreProvider, useStore } from './lib/store'
import { InstallProvider } from './lib/InstallContext'
import { ScrollManager, ScrollProgress, SmoothScroll } from './components/ScrollUX'
const LegalPage = lazy(() => import('./pages/LegalPage'))
import Layout from './components/Layout'
const Login = lazy(() => import('./pages/Login'))
const Home = lazy(() => import('./pages/Home'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const NewOrder = lazy(() => import('./pages/NewOrder'))
const Orders = lazy(() => import('./pages/Orders'))
const Services = lazy(() => import('./pages/Services'))
const AddFunds = lazy(() => import('./pages/AddFunds'))
const ApiPage = lazy(() => import('./pages/ApiPage'))
const SettingsPage = lazy(() => import('./pages/Settings'))
const Referral = lazy(() => import('./pages/Referral'))
const Support = lazy(() => import('./pages/Support'))
const Admin = lazy(() => import('./pages/Admin'))
import PageLoader from './components/PageLoader'
import ErrorBoundary from './components/ErrorBoundary'

function Toasts() {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} role="status">
          <span className="t-icon">
            {t.kind === 'success' ? (
              <CheckCircle2 />
            ) : t.kind === 'error' ? (
              <XCircle />
            ) : (
              <Info />
            )}
          </span>
          <div className="grow">
            <div className="t-title">{t.title}</div>
            {t.body ? <div className="t-body">{t.body}</div> : null}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss notification"
            style={{
              border: 0,
              background: 'none',
              color: '#5b6472',
              cursor: 'pointer',
              padding: 2,
            }}
          >
            <XCircle size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

function SourceDownload() {
  // Dev-only helper for grabbing the source archive while previewing the app.
  if (!import.meta.env.DEV) return null
  return (
    <a
      className="source-download"
      href="/downloads/UGrowSMM-full-source.zip"
      download="UGrowSMM-full-source.zip"
    >
      <Download size={15} /> Download source ZIP
    </a>
  )
}

function Shell() {
  const { state } = useStore()

  return (
    <>
      <Suspense fallback={<PageLoader full />}>
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/terms" element={<LegalPage slug="terms" />} />
        <Route path="/privacy" element={<LegalPage slug="privacy" />} />
        <Route path="/refund-policy" element={<LegalPage slug="refund" />} />
        <Route path="/cookies" element={<LegalPage slug="cookies" />} />
        <Route path="/home" element={<Home />} />

        {state.signedIn ? (
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new-order" element={<NewOrder />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/services" element={<Services />} />
            <Route path="/add-funds" element={<AddFunds />} />
            <Route path="/referral" element={<Referral />} />
            <Route path="/support" element={<Support />} />
            <Route path="/api" element={<ApiPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
      </Suspense>
      <Toasts />
    </>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <InstallProvider>
        <HashRouter>
          <SmoothScroll />
          <ScrollManager />
          <ScrollProgress />
          <ErrorBoundary>
            <Shell />
          </ErrorBoundary>
          <SourceDownload />
        </HashRouter>
      </InstallProvider>
    </StoreProvider>
  )
}
