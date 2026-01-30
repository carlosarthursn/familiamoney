import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';

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

  const maxValue = Math.max(income, expenses, 1);

  if (income === 0 && expenses === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Sem dados este mês</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          layout="vertical" 
          barSize={24}
          margin={{ top: 5, right: 70, left: 10, bottom: 5 }}
        >
          <XAxis 
            type="number" 
            hide 
            domain={[0, maxValue * 1.1]}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            axisLine={false} 
            tickLine={false}
            width={60}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          <Bar 
            dataKey="value" 
            radius={[0, 6, 6, 0]}
            maxBarSize={28}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList 
              dataKey="value" 
              position="right"
              formatter={(value: number) => formatCurrency(value)}
              style={{ 
                fontSize: 12, 
                fontWeight: 600, 
                fill: 'hsl(var(--foreground))' 
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}