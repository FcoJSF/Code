import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../utils/format.js'
import { addMonths } from '../../utils/debtCalc.js'

export default function PayoffChart({ timeline }) {
  // Thin out long timelines so the chart stays light
  const step = Math.max(1, Math.ceil(timeline.length / 60))
  const data = timeline
    .filter((_, i) => i % step === 0 || i === timeline.length - 1)
    .map(p => ({
      label: addMonths(new Date(), p.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      Balance: Math.round(p.balance),
    }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="payoffFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={36} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
          itemStyle={{ color: '#cbd5e1' }}
          formatter={value => [formatCurrency(value), 'Remaining debt']}
        />
        <Area type="monotone" dataKey="Balance" stroke="#f97316" strokeWidth={2} fill="url(#payoffFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
