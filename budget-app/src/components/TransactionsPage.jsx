import { useState, useEffect, useMemo } from 'react'
import { getAllAccounts, getTransactions, getAvailableMonths } from '../utils/db.js'
import { formatCurrency, formatMonthLabel } from '../utils/format.js'
import { Search } from 'lucide-react'
import { ALL_CATEGORIES } from '../utils/categorizer.js'

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState([])
  const [months, setMonths] = useState([])
  const [allTxns, setAllTxns] = useState([])
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([getAllAccounts(), getAvailableMonths()]).then(([accs, mos]) => {
      setAccounts(accs)
      setMonths(mos)
    })
  }, [])

  useEffect(() => {
    getTransactions({
      accountIds: selectedAccount === 'all' ? undefined : [selectedAccount],
      monthYear: selectedMonth === 'all' ? undefined : selectedMonth,
    }).then(setAllTxns)
  }, [selectedAccount, selectedMonth])

  const filtered = useMemo(() => {
    return allTxns.filter(t => {
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false
      if (selectedType !== 'all' && t.type !== selectedType) return false
      if (search && !t.concepto.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [allTxns, selectedCategory, selectedType, search])

  const totalFiltered = filtered.reduce((s, t) => t.type === 'expense' ? s - t.amount : s + t.amount, 0)

  return (
    <div className="px-4 pt-6 pb-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-slate-100">Transactions</h1>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-800 text-slate-200 placeholder-slate-500 text-sm rounded-xl pl-9 pr-4 py-2.5 border border-slate-700 outline-none focus:border-indigo-500"
        />
      </div>

      {/* Filters row 1 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterSelect value={selectedMonth} onChange={setSelectedMonth}>
          <option value="all">All months</option>
          {months.map(m => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
        </FilterSelect>
        <FilterSelect value={selectedAccount} onChange={setSelectedAccount}>
          <option value="all">All cards</option>
          {accounts.map(a => <option key={a.accountId} value={a.accountId}>{a.accountLabel}</option>)}
        </FilterSelect>
        <FilterSelect value={selectedType} onChange={setSelectedType}>
          <option value="all">All types</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </FilterSelect>
        <FilterSelect value={selectedCategory} onChange={setSelectedCategory}>
          <option value="all">All categories</option>
          {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </FilterSelect>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{filtered.length} transactions</span>
        <span className={`font-semibold ${totalFiltered >= 0 ? 'text-green-400' : 'text-orange-400'}`}>
          {totalFiltered >= 0 ? '+' : ''}{formatCurrency(totalFiltered)}
        </span>
      </div>

      {/* Transaction list */}
      <div className="flex flex-col gap-2">
        {filtered.map(t => (
          <div key={t.id} className="bg-slate-900 rounded-xl p-3 flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-100 truncate font-medium">{t.concepto}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{t.category}</span>
                <span className="text-xs text-slate-500">{t.dateLabel}</span>
                <span className="text-xs text-slate-600">· {t.accountLabel}</span>
              </div>
            </div>
            <span className={`text-sm font-semibold flex-shrink-0 ${t.type === 'income' ? 'text-green-400' : 'text-slate-200'}`}>
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-slate-500 text-sm py-12">
            No transactions found
          </div>
        )}
      </div>
    </div>
  )
}

function FilterSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="flex-shrink-0 bg-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 border border-slate-700 appearance-none pr-6"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
    >
      {children}
    </select>
  )
}
