import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { getCategoryInfo } from '@/types/finance';

interface ExpenseChartProps {
  expensesByCategory: Record<string, number>;
}

const COLORS = [
  'hsl(168, 60%, 42%)',
  'hsl(0, 70%, 55%)',
  'hsl(38, 92%, 50%)',
  'hsl(145, 60%, 45%)',
  'hsl(220, 70%, 50%)',
  'hsl(280, 60%, 50%)',
  'hsl(30, 80%, 50%)',
  'hsl(190, 70%, 45%)',
  'hsl(340, 60%, 50%)',
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function ExpenseChart({ expensesByCategory }: ExpenseChartProps) {
  const data = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: getCategoryInfo(category, 'expense').label,
    value: amount,
    category,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Sem despesas este mês</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${entry.category}`} 
                fill={COLORS[index % COLORS.length]}
                className="stroke-background stroke-2"
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {data.slice(0, 5).map((item, index) => (
          <div key={item.category} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-muted-foreground">{item.name}</span>
            </div>
            <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
