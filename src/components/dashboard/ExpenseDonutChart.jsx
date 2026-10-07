import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatYen } from '../../utils/currency'

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
]

function ExpenseDonutChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="category" innerRadius={60} outerRadius={100} paddingAngle={2} stroke="none">
          {data.map((entry, index) => (
            <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatYen(value)}
          contentStyle={{
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            color: 'var(--color-text)',
          }}
          itemStyle={{ color: 'var(--color-text)' }}
        />
        <Legend verticalAlign="bottom" height={48} wrapperStyle={{ color: 'var(--color-text-muted)', fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default ExpenseDonutChart
