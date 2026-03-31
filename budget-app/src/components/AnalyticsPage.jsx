import { useState, useEffect } from 'react'
import { getAllAccounts, getTransactions, getAvailableMonths } from '../utils/db.js'
import { formatCurrency, formatMonthLabel } from '../utils/format.js'
import CategoryChart from './charts/CategoryChart.jsx'

export default function AnalyticsPage() {
  const [accounts, setAccounts] = useState([])
  const [months, setMonths] = useState([])
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedAccounts, setSelectedAccounts] = useState([])
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    Promise.all([getAllAccounts(), getAvailableMonths()]).then(([accs, mos]) => {
      setAccounts(accs)
      setMonths(mos)
      setSelectedAccounts(accs.map(a => a.accountId))
    })
  }, [])

  useEffect(() => {
    if (selectedAccounts.length === 0) return
    getTransactions({
      accountIds: selectedAccounts,
      monthYear: selectedMonth === 'all' ? undefined : selectedMonth,
    }).then(setTransactions)
  }, [selectedAccounts, selectedMonth])

  const expenses = transactions.filter(t => t.type === 'expense')
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0)

  // Group by category
  const byCategory = {}
  for (const t of expenses) {
    if (!byCategory[t.category]) byCategory[t.category] = { amount: 0, count: 0, color: t.color }
    byCategory[t.category].amount += t.amount
    byCategory[t.category].count += 1
  }
  const categoryList = Object.entries(byCategory)
    .map(([name, { amount, count, color }]) => ({ name, amount, count, color, pct: totalExpense > 0 ? amount / totalExpense : 0 }))
    .sort((a, b) => b.amount - a.amount)

  return (
    <div className="px-4 pt-6 pb-4 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Analytics</h1>
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

      {/* Card filter */}
      {accounts.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {accounts.map(acc => {
            const active = selectedAccounts.includes(acc.accountId)
            return (
              <button
                key={acc.accountId}
                onClick={() => {
                  setSelectedAccounts(prev =>
                    prev.includes(acc.accountId)
                      ? prev.filter(a => a !== acc.accountId)
                      : [...prev, acc.accountId]
                  )
                }}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  active ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {acc.accountLabel}
              </button>
            )
          })}
        </div>
      )}

      {/* Donut chart */}
      <div className="bg-slate-900 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-1">Spending by category</h2>
        <p className="text-xs text-slate-500 mb-3">Total: {formatCurrency(totalExpense)}</p>
        <CategoryChart transactions={transactions} />
      </div>

      {/* Category breakdown list */}
      <div className="bg-slate-900 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Category breakdown</h2>
        <div className="flex flex-col gap-3">
          {categoryList.map(({ name, amount, count, color, pct }) => (
            <div key={name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm text-slate-200">{name}</span>
                  <span className="text-xs text-slate-500">({count} txns)</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-slate-200">{formatCurrency(amount)}</span>
                  <span className="text-xs text-slate-500 ml-2">{(pct * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct * 100}%`, backgroundColor: color }}
                />
              </div>
            </div>
          ))}
          {categoryList.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">No expense data for this period</p>
          )}
        </div>
      </div>
    </div>
  )
}
