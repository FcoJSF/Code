import { useState, useEffect } from 'react'
import { getGoals, saveGoal, deleteGoal } from '../../utils/db.js'
import { formatCurrency } from '../../utils/format.js'
import { Plus, Trash2, Pencil, X, PiggyBank } from 'lucide-react'

const EMPTY_FORM = { name: '', target: '', saved: '', monthly: '' }

export default function SavingsSection() {
  const [goals, setGoals] = useState([])
  const [form, setForm] = useState(null)
  const [depositFor, setDepositFor] = useState(null) // goal id receiving a deposit
  const [depositAmount, setDepositAmount] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getGoals().then(gs => {
      setGoals(gs)
      setLoaded(true)
    })
  }, [])

  const totalSaved = goals.reduce((s, g) => s + g.saved, 0)
  const totalTarget = goals.reduce((s, g) => s + g.target, 0)

  async function submitForm() {
    const goal = {
      name: form.name.trim() || 'Goal',
      target: parseFloat(form.target) || 0,
      saved: parseFloat(form.saved) || 0,
      monthly: parseFloat(form.monthly) || 0,
    }
    if (form.id != null) goal.id = form.id
    await saveGoal(goal)
    setGoals(await getGoals())
    setForm(null)
  }

  async function removeGoal(id) {
    await deleteGoal(id)
    setGoals(await getGoals())
  }

  async function submitDeposit() {
    const amount = parseFloat(depositAmount)
    const goal = goals.find(g => g.id === depositFor)
    if (goal && amount > 0) {
      await saveGoal({ ...goal, saved: goal.saved + amount })
      setGoals(await getGoals())
    }
    setDepositFor(null)
    setDepositAmount('')
  }

  if (!loaded) return null

  return (
    <div className="flex flex-col gap-4">
      {goals.length === 0 && !form && (
        <div className="bg-slate-900 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <div className="text-4xl">🎯</div>
          <h2 className="text-base font-semibold text-slate-100">Set a savings goal</h2>
          <p className="text-slate-400 text-sm">An emergency fund, a trip, a new phone — set a target and track your progress toward it.</p>
        </div>
      )}

      {goals.length > 1 && (
        <div className="bg-slate-900 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-900/50 flex items-center justify-center flex-shrink-0">
            <PiggyBank size={18} className="text-green-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Total saved</p>
            <p className="text-sm font-bold text-green-400">
              {formatCurrency(totalSaved)} <span className="text-slate-500 font-normal">of {formatCurrency(totalTarget)}</span>
            </p>
          </div>
        </div>
      )}

      {goals.map(g => {
        const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0
        const remaining = Math.max(0, g.target - g.saved)
        const monthsLeft = g.monthly > 0 && remaining > 0 ? Math.ceil(remaining / g.monthly) : null
        const eta = monthsLeft != null
          ? new Date(new Date().setMonth(new Date().getMonth() + monthsLeft)).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : null
        const done = remaining === 0 && g.target > 0
        return (
          <div key={g.id} className="bg-slate-900 rounded-2xl p-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-100 flex-1 truncate">{done ? '✅ ' : ''}{g.name}</p>
              <button onClick={() => setForm({ id: g.id, name: g.name, target: String(g.target), saved: String(g.saved), monthly: String(g.monthly) })} className="p-1.5 text-slate-400">
                <Pencil size={14} />
              </button>
              <button onClick={() => removeGoal(g.id)} className="p-1.5 text-red-400/70">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${done ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">
                {formatCurrency(g.saved)} <span className="text-slate-500">of {formatCurrency(g.target)}</span>
              </span>
              <span className="text-slate-500">
                {done ? 'Goal reached! 🎉' : eta ? `~${eta} at ${formatCurrency(g.monthly)}/mo` : `${formatCurrency(remaining)} to go`}
              </span>
            </div>
            {!done && (
              depositFor === g.id ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="number"
                    inputMode="decimal"
                    placeholder="Amount"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitDeposit()}
                    className="flex-1 bg-slate-800 text-slate-100 text-sm rounded-xl px-3 py-2 border border-indigo-500 outline-none"
                  />
                  <button onClick={submitDeposit} className="bg-indigo-600 text-white text-sm font-semibold rounded-xl px-4">Add</button>
                  <button onClick={() => { setDepositFor(null); setDepositAmount('') }} className="text-slate-500 px-1"><X size={16} /></button>
                </div>
              ) : (
                <button
                  onClick={() => setDepositFor(g.id)}
                  className="self-start text-xs font-medium text-indigo-400 bg-indigo-900/40 border border-indigo-800/50 rounded-lg px-3 py-1.5"
                >
                  + Add money
                </button>
              )
            )}
          </div>
        )
      })}

      {form ? (
        <div className="bg-slate-900 rounded-2xl p-4 flex flex-col gap-3 border border-indigo-800/50">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">{form.id != null ? 'Edit goal' : 'New goal'}</h2>
            <button onClick={() => setForm(null)} className="p-1 text-slate-500"><X size={16} /></button>
          </div>
          <Field label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="e.g. Emergency fund" type="text" />
          <Field label="Target amount" value={form.target} onChange={v => setForm({ ...form, target: v })} placeholder="30000" />
          <Field label="Already saved" value={form.saved} onChange={v => setForm({ ...form, saved: v })} placeholder="0" />
          <Field label="Planned monthly contribution" value={form.monthly} onChange={v => setForm({ ...form, monthly: v })} placeholder="1500" />
          <button
            onClick={submitForm}
            disabled={!(parseFloat(form.target) > 0)}
            className="bg-indigo-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl py-2.5 mt-1"
          >
            Save goal
          </button>
        </div>
      ) : (
        <button
          onClick={() => setForm({ ...EMPTY_FORM })}
          className="flex items-center justify-center gap-2 bg-slate-900 border border-dashed border-slate-700 text-slate-300 text-sm font-medium rounded-2xl py-3"
        >
          <Plus size={16} /> Add goal
        </button>
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
