import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency, formatMonthLabel } from '../../utils/format.js'

export default function IncomeOutcomeChart({ transactions }) {
  // Group by month
  const byMonth = {}
  for (const t of transactions) {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[key]) byMonth[key] = { income: 0, expense: 0 }
    if (t.type === 'income') byMonth[key].income += t.amount
    else byMonth[key].expense += t.amount
  }

  const data = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, vals]) => ({
      month: formatMonthLabel(month),
      Income: Math.round(vals.income),
      Expenses: Math.round(vals.expense),
    }))

  if (!data.length) return <EmptyState />

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={36} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
          itemStyle={{ color: '#cbd5e1' }}
          formatter={(value) => [formatCurrency(value)]}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, color: '#94a3b8' }} />
        <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">
      No data yet
    </div>
  )
}
