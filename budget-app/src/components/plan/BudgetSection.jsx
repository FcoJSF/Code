import { useState, useEffect } from 'react'
import { getBudgets, setBudget, getSetting, setSetting, getTransactions, getAvailableMonths } from '../../utils/db.js'
import { formatCurrency, formatMonthLabel } from '../../utils/format.js'
import { ALL_CATEGORIES, CATEGORY_COLORS } from '../../utils/categorizer.js'
import { PiggyBank, Pencil, Check } from 'lucide-react'

const EXPENSE_CATEGORIES = ALL_CATEGORIES.filter(c => c !== 'Income')

function currentMonthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function BudgetSection() {
  const [income, setIncome] = useState('')
  const [budgets, setBudgets] = useState({})
  const [spent, setSpent] = useState({})
  const [months, setMonths] = useState([])
  const [month, setMonth] = useState(currentMonthKey())
  const [editing, setEditing] = useState(null) // category being edited
  const [draft, setDraft] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([getSetting('monthlyIncome', ''), getBudgets(), getAvailableMonths()]).then(
      ([inc, buds, mos]) => {
        setIncome(inc === '' ? '' : String(inc))
        setBudgets(Object.fromEntries(buds.map(b => [b.category, b.limit])))
        setMonths(mos)
        // Default to the newest month that actually has data
        if (mos.length > 0 && !mos.includes(currentMonthKey())) setMonth(mos[0])
        setLoaded(true)
      }
    )
  }, [])

  useEffect(() => {
    getTransactions({ monthYear: month }).then(txs => {
      const byCat = {}
      for (const t of txs) {
        if (t.type !== 'expense') continue
        byCat[t.category] = (byCat[t.category] || 0) + t.amount
      }
      setSpent(byCat)
    })
  }, [month])

  const incomeNum = parseFloat(income) || 0
  const totalBudgeted = Object.values(budgets).reduce((s, v) => s + v, 0)
  const totalSpent = Object.values(spent).reduce((s, v) => s + v, 0)
  const leftToBudget = incomeNum - totalBudgeted

  function saveIncome(value) {
    setIncome(value)
    const n = parseFloat(value)
    setSetting('monthlyIncome', isNaN(n) ? '' : n)
  }

  function startEdit(cat) {
    setEditing(cat)
    setDraft(budgets[cat] ? String(budgets[cat]) : '')
  }

  function commitEdit() {
    const n = parseFloat(draft) || 0
    setBudget(editing, n)
    setBudgets(prev => {
      const next = { ...prev }
      if (n > 0) next[editing] = n
      else delete next[editing]
      return next
    })
    setEditing(null)
  }

  if (!loaded) return null

  // Categories with a budget or spending first, then the rest
  const ordered = [...EXPENSE_CATEGORIES].sort((a, b) => {
    const aActive = (budgets[a] || 0) > 0 || (spent[a] || 0) > 0 ? 1 : 0
    const bActive = (budgets[b] || 0) > 0 || (spent[b] || 0) > 0 ? 1 : 0
    return bActive - aActive
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Income */}
      <div className="bg-slate-900 rounded-2xl p-4 flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-300">Monthly income</label>
        <input
          type="number"
          inputMode="decimal"
          placeholder="e.g. 25000"
          value={income}
          onChange={e => saveIncome(e.target.value)}
          className="bg-slate-800 text-slate-100 text-lg font-semibold rounded-xl px-3 py-2.5 border border-slate-700 outline-none focus:border-indigo-500 w-full"
        />
        {incomeNum > 0 && (
          <p className="text-xs text-slate-500">
            50/30/20 guide: needs {formatCurrency(incomeNum * 0.5)} · wants {formatCurrency(incomeNum * 0.3)} · savings & debt {formatCurrency(incomeNum * 0.2)}
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="bg-slate-900 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">This month</h2>
          {months.length > 0 && (
            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1.5 border border-slate-700"
            >
              {!months.includes(currentMonthKey()) && (
                <option value={currentMonthKey()}>{formatMonthLabel(currentMonthKey())}</option>
              )}
              {months.map(m => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Budgeted</p>
            <p className="text-sm font-bold text-slate-200">{formatCurrency(totalBudgeted)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Spent</p>
            <p className={`text-sm font-bold ${totalBudgeted > 0 && totalSpent > totalBudgeted ? 'text-red-400' : 'text-orange-400'}`}>
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Unbudgeted</p>
            <p className={`text-sm font-bold ${leftToBudget >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {incomeNum > 0 ? formatCurrency(leftToBudget) : '—'}
            </p>
          </div>
        </div>
        {incomeNum > 0 && leftToBudget > 0 && (
          <div className="flex items-center gap-2 bg-green-900/30 border border-green-800/50 rounded-xl px-3 py-2">
            <PiggyBank size={16} className="text-green-400 flex-shrink-0" />
            <p className="text-xs text-green-300">
              {formatCurrency(leftToBudget)} of income is unbudgeted — consider sending it to savings or extra debt payments.
            </p>
          </div>
        )}
      </div>

      {/* Category budgets */}
      <div className="bg-slate-900 rounded-2xl p-4 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-300">Category limits</h2>
        <p className="text-xs text-slate-500 -mt-2">Tap the pencil to set a monthly limit. Spending comes from your uploaded transactions.</p>
        {ordered.map(cat => {
          const limit = budgets[cat] || 0
          const used = spent[cat] || 0
          const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0
          const over = limit > 0 && used > limit
          const isEditing = editing === cat
          return (
            <div key={cat} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                <span className="text-sm text-slate-200 flex-1 truncate">{cat}</span>
                {isEditing ? (
                  <span className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="number"
                      inputMode="decimal"
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && commitEdit()}
                      className="w-24 bg-slate-800 text-slate-100 text-sm rounded-lg px-2 py-1 border border-indigo-500 outline-none"
                    />
                    <button onClick={commitEdit} className="p-1.5 rounded-lg bg-indigo-600 text-white">
                      <Check size={14} />
                    </button>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className={`text-xs ${over ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>
                      {formatCurrency(used)}{limit > 0 && ` / ${formatCurrency(limit)}`}
                    </span>
                    <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
                      <Pencil size={13} />
                    </button>
                  </span>
                )}
              </div>
              {limit > 0 && (
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-indigo-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
