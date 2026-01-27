import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

interface MonthlyChartProps {
  income: number;
  expenses: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function MonthlyChart({ income, expenses }: MonthlyChartProps) {
  const data = [
    { name: 'Receitas', value: income, color: 'hsl(145, 60%, 45%)' },
    { name: 'Despesas', value: expenses, color: 'hsl(0, 70%, 55%)' },
  ];

  if (income === 0 && expenses === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <p>Sem dados este mês</p>
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" barSize={32}>
          <XAxis type="number" hide />
          <YAxis 
            type="category" 
            dataKey="name" 
            axisLine={false} 
            tickLine={false}
            width={80}
            tick={{ fontSize: 14, fill: 'hsl(var(--muted-foreground))' }}
          />
          <Bar 
            dataKey="value" 
            radius={[0, 8, 8, 0]}
            label={{ 
              position: 'right', 
              formatter: (value: number) => formatCurrency(value),
              fontSize: 14,
              fontWeight: 600,
              fill: 'hsl(var(--foreground))'
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
