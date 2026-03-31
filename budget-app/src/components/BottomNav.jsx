import { LayoutDashboard, List, Upload, PieChart } from 'lucide-react'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', Icon: PieChart },
  { id: 'transactions', label: 'Transactions', Icon: List },
  { id: 'upload', label: 'Upload', Icon: Upload },
]

export default function BottomNav({ active, onSelect }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                isActive ? 'text-indigo-400' : 'text-slate-500'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
