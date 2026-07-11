import { useState } from 'react'
import BudgetSection from './plan/BudgetSection.jsx'
import DebtsSection from './plan/DebtsSection.jsx'
import SavingsSection from './plan/SavingsSection.jsx'

const sections = [
  { id: 'budget', label: 'Budget' },
  { id: 'debts', label: 'Debts' },
  { id: 'savings', label: 'Savings' },
]

export default function PlanPage() {
  const [section, setSection] = useState('budget')

  return (
    <div className="px-4 pt-6 pb-4 flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-slate-100">Plan</h1>

      <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${
              section === s.id ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'budget' && <BudgetSection />}
      {section === 'debts' && <DebtsSection />}
      {section === 'savings' && <SavingsSection />}
    </div>
  )
}
