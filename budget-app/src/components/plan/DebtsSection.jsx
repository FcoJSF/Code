import { useState, useEffect } from 'react'
import { getDebts, saveDebt, deleteDebt, getSetting, setSetting } from '../../utils/db.js'
import { simulatePayoff, formatMonthsDuration } from '../../utils/debtCalc.js'
import { formatCurrency } from '../../utils/format.js'
import PayoffChart from '../charts/PayoffChart.jsx'
import { Plus, Trash2, Pencil, X, CalendarCheck, Flame, TrendingDown } from 'lucide-react'

const EMPTY_FORM = { name: '', balance: '', apr: '', minPayment: '' }

export default function DebtsSection() {
  const [debts, setDebts] = useState([])
  const [extra, setExtra] = useState('')
  const [strategy, setStrategy] = useState('avalanche')
  const [form, setForm] = useState(null) // null = closed, {id?, ...fields} = open
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([getDebts(), getSetting('extraDebtPayment', ''), getSetting('debtStrategy', 'avalanche')]).then(
      ([ds, ex, st]) => {
        setDebts(ds)
        setExtra(ex === '' ? '' : String(ex))
        setStrategy(st)
        setLoaded(true)
      }
    )
  }, [])

  const extraNum = parseFloat(extra) || 0
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0)
  const totalMin = debts.reduce((s, d) => s + (d.minPayment || 0), 0)

  const plan = debts.length > 0 ? simulatePayoff(debts, extraNum, strategy) : null
  const altPlan = debts.length > 1
    ? simulatePayoff(debts, extraNum, strategy === 'avalanche' ? 'snowball' : 'avalanche')
    : null
  const altSavings = plan && !plan.impossible && altPlan && !altPlan.impossible
    ? altPlan.totalInterest - plan.totalInterest
    : 0

  function updateExtra(value) {
    setExtra(value)
    const n = parseFloat(value)
    setSetting('extraDebtPayment', isNaN(n) ? '' : n)
  }

  function updateStrategy(s) {
    setStrategy(s)
    setSetting('debtStrategy', s)
  }

  async function submitForm() {
    const debt = {
      name: form.name.trim() || 'Debt',
      balance: parseFloat(form.balance) || 0,
      apr: parseFloat(form.apr) || 0,
      minPayment: parseFloat(form.minPayment) || 0,
    }
    if (form.id != null) debt.id = form.id
    await saveDebt(debt)
    setDebts(await getDebts())
    setForm(null)
  }

  async function removeDebt(id) {
    await deleteDebt(id)
    setDebts(await getDebts())
  }

  if (!loaded) return null

  return (
    <div className="flex flex-col gap-4">
      {debts.length === 0 && !form && (
        <div className="bg-slate-900 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <div className="text-4xl">💳</div>
          <h2 className="text-base font-semibold text-slate-100">Track your debts</h2>
          <p className="text-slate-400 text-sm">Add credit cards, loans, or anything you owe, and get a payoff plan with a debt-free date.</p>
        </div>
      )}

      {/* Debt list */}
      {debts.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Your debts</h2>
            <span className="text-sm font-bold text-red-400">{formatCurrency(totalDebt)}</span>
          </div>
          {debts.map(d => {
            const info = plan && !plan.impossible ? plan.perDebt.find(p => p.id === d.id) : null
            return (
              <div key={d.id} className="flex items-center gap-3 bg-slate-800/60 rounded-xl px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium truncate">{d.name}</p>
                  <p className="text-xs text-slate-500">
                    {d.apr}% APR · min {formatCurrency(d.minPayment)}
                    {info && ` · paid off ${info.paidOffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-200 flex-shrink-0">{formatCurrency(d.balance)}</span>
                <button onClick={() => setForm({ id: d.id, name: d.name, balance: String(d.balance), apr: String(d.apr), minPayment: String(d.minPayment) })} className="p-1.5 rounded-lg text-slate-400">
                  <Pencil size={14} />
                </button>
                <button onClick={() => removeDebt(d.id)} className="p-1.5 rounded-lg text-red-400/70">
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / edit form */}
      {form ? (
        <div className="bg-slate-900 rounded-2xl p-4 flex flex-col gap-3 border border-indigo-800/50">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">{form.id != null ? 'Edit debt' : 'New debt'}</h2>
            <button onClick={() => setForm(null)} className="p-1 text-slate-500"><X size={16} /></button>
          </div>
          <Field label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="e.g. BBVA credit card" type="text" />
          <Field label="Current balance" value={form.balance} onChange={v => setForm({ ...form, balance: v })} placeholder="12000" />
          <Field label="Interest rate (APR %)" value={form.apr} onChange={v => setForm({ ...form, apr: v })} placeholder="45" />
          <Field label="Minimum monthly payment" value={form.minPayment} onChange={v => setForm({ ...form, minPayment: v })} placeholder="600" />
          <button
            onClick={submitForm}
            disabled={!(parseFloat(form.balance) > 0)}
            className="bg-indigo-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl py-2.5 mt-1"
          >
            Save debt
          </button>
        </div>
      ) : (
        <button
          onClick={() => setForm({ ...EMPTY_FORM })}
          className="flex items-center justify-center gap-2 bg-slate-900 border border-dashed border-slate-700 text-slate-300 text-sm font-medium rounded-2xl py-3"
        >
          <Plus size={16} /> Add debt
        </button>
      )}

      {/* Payoff plan */}
      {debts.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-300">Payoff plan</h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400">Extra payment per month (on top of {formatCurrency(totalMin)} in minimums)</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 1000"
              value={extra}
              onChange={e => updateExtra(e.target.value)}
              className="bg-slate-800 text-slate-100 text-base font-semibold rounded-xl px-3 py-2.5 border border-slate-700 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex bg-slate-800 rounded-xl p-1">
            {[
              { id: 'avalanche', label: 'Avalanche', hint: 'highest interest first' },
              { id: 'snowball', label: 'Snowball', hint: 'smallest balance first' },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => updateStrategy(s.id)}
                className={`flex-1 py-2 rounded-lg transition-colors ${strategy === s.id ? 'bg-indigo-600' : ''}`}
              >
                <span className={`block text-sm font-medium ${strategy === s.id ? 'text-white' : 'text-slate-400'}`}>{s.label}</span>
                <span className={`block text-[10px] ${strategy === s.id ? 'text-indigo-200' : 'text-slate-500'}`}>{s.hint}</span>
              </button>
            ))}
          </div>

          {plan?.impossible ? (
            <div className="bg-red-900/30 border border-red-800/50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-red-300">
                Payments don't keep up with interest — the balance never reaches zero. Increase the extra payment or the minimums.
              </p>
            </div>
          ) : plan && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <PlanStat Icon={CalendarCheck} label="Debt-free" value={plan.debtFreeDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} color="text-green-400" />
                <PlanStat Icon={TrendingDown} label="Time" value={formatMonthsDuration(plan.months)} color="text-blue-400" />
                <PlanStat Icon={Flame} label="Interest" value={formatCurrency(plan.totalInterest)} color="text-orange-400" />
              </div>

              <PayoffChart timeline={plan.timeline} />

              {altSavings > 1 && (
                <p className="text-xs text-green-300 bg-green-900/30 border border-green-800/50 rounded-xl px-3 py-2">
                  {strategy === 'avalanche' ? 'Avalanche' : 'Snowball'} saves you {formatCurrency(altSavings)} in interest vs. {strategy === 'avalanche' ? 'snowball' : 'avalanche'}.
                </p>
              )}
              {altSavings < -1 && (
                <p className="text-xs text-orange-300 bg-orange-900/30 border border-orange-800/50 rounded-xl px-3 py-2">
                  Switching to {strategy === 'avalanche' ? 'snowball' : 'avalanche'} would save {formatCurrency(-altSavings)} in interest.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'number' }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400">{label}</label>
      <input
        type={type}
        inputMode={type === 'number' ? 'decimal' : undefined}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-slate-800 text-slate-100 text-sm rounded-xl px-3 py-2.5 border border-slate-700 outline-none focus:border-indigo-500"
      />
    </div>
  )
}

function PlanStat({ Icon, label, value, color }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-2.5 flex flex-col items-center gap-1 text-center">
      <Icon size={15} className={color} />
      <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xs font-bold ${color} leading-tight`}>{value}</p>
    </div>
  )
}
