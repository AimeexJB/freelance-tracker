import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatYen } from '../../utils/currency'

function TrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" vertical={false} />
        <XAxis dataKey="month" stroke="var(--color-text-muted)" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
        <YAxis
          stroke="var(--color-text-muted)"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
          tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value) => formatYen(value)}
          contentStyle={{
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            color: 'var(--color-text)',
          }}
        />
        <Legend wrapperStyle={{ color: 'var(--color-text-muted)', fontSize: 12 }} />
        <Bar dataKey="income" name="Income" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Expenses" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default TrendChart
