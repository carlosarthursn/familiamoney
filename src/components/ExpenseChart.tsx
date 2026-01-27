import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getCategoryInfo } from '@/types/finance';

interface ExpenseChartProps {
  expensesByCategory: Record<string, number>;
}

const COLORS = [
  'hsl(168, 65%, 45%)',
  'hsl(0, 75%, 58%)',
  'hsl(38, 92%, 55%)',
  'hsl(145, 65%, 48%)',
  'hsl(220, 70%, 55%)',
  'hsl(280, 60%, 55%)',
  'hsl(30, 80%, 55%)',
  'hsl(190, 70%, 50%)',
  'hsl(340, 60%, 55%)',
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
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        <p>Sem despesas este mês</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-48"> {/* Aumentando a altura do container */}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50} // Aumentando o raio interno
              outerRadius={75} // Aumentando o raio externo
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${entry.category}`} 
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {data.slice(0, 8).map((item, index) => (
          <div key={item.category} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <div 
                className="h-2.5 w-2.5 rounded-full shrink-0" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs text-muted-foreground truncate">{item.name}</span>
            </div>
            <span className="text-xs font-medium">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}