import { useState } from 'react'
import BottomNav from './components/BottomNav.jsx'
import DashboardPage from './components/DashboardPage.jsx'
import AnalyticsPage from './components/AnalyticsPage.jsx'
import TransactionsPage from './components/TransactionsPage.jsx'
import UploadPage from './components/UploadPage.jsx'

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)

  function onUploaded() {
    setRefreshKey(k => k + 1)
    setTab('dashboard')
  }

  return (
    <div className="flex flex-col min-h-dvh bg-slate-950 text-slate-100 max-w-lg mx-auto">
      <main className="flex-1 overflow-y-auto pb-20">
        {tab === 'dashboard'     && <DashboardPage key={refreshKey} />}
        {tab === 'analytics'     && <AnalyticsPage key={refreshKey} />}
        {tab === 'transactions'  && <TransactionsPage key={refreshKey} />}
        {tab === 'upload'        && <UploadPage onUploaded={onUploaded} />}
      </main>
      <BottomNav active={tab} onSelect={setTab} />
    </div>
  )
}
