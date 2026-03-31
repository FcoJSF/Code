import { useState, useEffect } from 'react'
import { getAllAccounts, getTransactions, getAvailableMonths } from '../utils/db.js'
import { formatCurrency, formatMonthLabel } from '../utils/format.js'
import IncomeOutcomeChart from './charts/IncomeOutcomeChart.jsx'
import { TrendingUp, TrendingDown, Wallet, ChevronDown } from 'lucide-react'

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([])
  const [months, setMonths] = useState([])
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedAccounts, setSelectedAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAllAccounts(), getAvailableMonths()]).then(([accs, mos]) => {
      setAccounts(accs)
      setMonths(mos)
      setSelectedAccounts(accs.map(a => a.accountId))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    getTransactions({
      accountIds: selectedAccounts,
      monthYear: selectedMonth === 'all' ? undefined : selectedMonth,
    }).then(setTransactions)
  }, [selectedAccounts, selectedMonth])

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const net = totalIncome - totalExpense

  function toggleAccount(id) {
    setSelectedAccounts(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  if (loading) return <LoadingScreen />

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <div className="text-5xl">💰</div>
        <h2 className="text-xl font-semibold text-slate-100">No data yet</h2>
        <p className="text-slate-400 text-sm">Upload your bank CSV files using the Upload tab to get started.</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="bg-slate-800 text-slate-200 text-sm rounded-xl px-3 py-2 border border-slate-700 appearance-none pr-8"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
        >
          <option value="all">All time</option>
          {months.map(m => (
            <option key={m} value={m}>{formatMonthLabel(m)}</option>
          ))}
        </select>
      </div>

      {/* Account filter chips */}
      {accounts.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {accounts.map(acc => {
            const active = selectedAccounts.includes(acc.accountId)
            return (
              <button
                key={acc.accountId}
                onClick={() => toggleAccount(acc.accountId)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {acc.accountLabel}
              </button>
            )
          })}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Income" value={totalIncome} color="text-green-400" Icon={TrendingUp} iconColor="bg-green-900/50" />
        <StatCard label="Expenses" value={totalExpense} color="text-orange-400" Icon={TrendingDown} iconColor="bg-orange-900/50" />
        <StatCard label="Net" value={net} color={net >= 0 ? 'text-blue-400' : 'text-red-400'} Icon={Wallet} iconColor="bg-blue-900/50" />
      </div>

      {/* Income vs Outcome chart */}
      <div className="bg-slate-900 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Income vs Expenses (monthly)</h2>
        <IncomeOutcomeChart transactions={transactions} />
      </div>

      {/* Recent transactions */}
      <div className="bg-slate-900 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Recent transactions</h2>
        <div className="flex flex-col gap-2">
          {transactions.slice(0, 8).map(t => (
            <TransactionRow key={t.id} t={t} />
          ))}
          {transactions.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">No transactions for this period</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, Icon, iconColor }) {
  return (
    <div className="bg-slate-900 rounded-2xl p-3 flex flex-col gap-2">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconColor}`}>
        <Icon size={16} className={color} />
      </div>
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-bold ${color} leading-tight`}>
          {formatCurrency(Math.abs(value))}
        </p>
      </div>
    </div>
  )
}

function TransactionRow({ t }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">{t.concepto}</p>
        <p className="text-xs text-slate-500">{t.category} · {t.dateLabel}</p>
      </div>
      <span className={`text-sm font-semibold flex-shrink-0 ${t.type === 'income' ? 'text-green-400' : 'text-slate-200'}`}>
        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
      </span>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
