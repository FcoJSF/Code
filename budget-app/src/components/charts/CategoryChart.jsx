import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../utils/format.js'

const RADIAN = Math.PI / 180
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function CategoryChart({ transactions }) {
  const expenses = transactions.filter(t => t.type === 'expense')
  const byCategory = {}
  for (const t of expenses) {
    if (!byCategory[t.category]) byCategory[t.category] = { amount: 0, color: t.color }
    byCategory[t.category].amount += t.amount
  }

  const data = Object.entries(byCategory)
    .map(([name, { amount, color }]) => ({ name, value: Math.round(amount), color }))
    .sort((a, b) => b.value - a.value)

  if (!data.length) return (
    <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">No expense data</div>
  )

  return (
    <div className="flex flex-col gap-3">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={renderLabel}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
            formatter={(value) => [formatCurrency(value)]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-2">
        {data.map(({ name, value, color }) => (
          <div key={name} className="flex items-center gap-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-400 truncate">{name}</span>
            <span className="text-xs text-slate-300 ml-auto flex-shrink-0">{formatCurrency(value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
