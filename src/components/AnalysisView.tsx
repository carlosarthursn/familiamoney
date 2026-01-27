import { MonthlyChart } from './MonthlyChart';
import { ExpenseChart } from './ExpenseChart';
import { useTransactions } from '@/hooks/useTransactions';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AnalysisViewProps {
  selectedDate: Date;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function AnalysisView({ selectedDate }: AnalysisViewProps) {
  const { 
    isLoading, 
    totalIncome, 
    totalExpenses, 
    balance,
    expensesByCategory,
  } = useTransactions(selectedDate);

  const monthYear = format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const netFlow = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Análise de {monthYear}</h2>

      {/* Net Flow Summary (Funnel/Flow concept) */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <h3 className="font-semibold mb-2 text-muted-foreground">Fluxo Líquido (Receitas - Despesas)</h3>
        <div className="flex items-center justify-between">
          <p className={cn(
            "text-2xl font-bold",
            netFlow >= 0 ? "text-success" : "text-destructive"
          )}>
            {formatCurrency(netFlow)}
          </p>
          <div className={cn(
            "p-2 rounded-full",
            netFlow >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            {netFlow >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {totalIncome > 0 || totalExpenses > 0 ? 
            `Receitas: ${formatCurrency(totalIncome)} | Despesas: ${formatCurrency(totalExpenses)}` :
            'Sem dados para calcular o fluxo.'
          }
        </p>
      </div>

      {/* Monthly Chart */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <h3 className="font-semibold mb-4">Comparativo Mensal</h3>
        <MonthlyChart income={totalIncome} expenses={totalExpenses} />
      </div>

      {/* Expense Category Chart */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <h3 className="font-semibold mb-4">Despesas por Categoria</h3>
        <ExpenseChart expensesByCategory={expensesByCategory} />
      </div>
    </div>
  );
}