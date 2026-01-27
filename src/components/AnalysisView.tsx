import { useState, useEffect } from 'react';
import { MonthlyChart } from './MonthlyChart';
import { ExpenseChart } from './ExpenseChart';
import { CategoryFilter } from './CategoryFilter';
import { useTransactions } from '@/hooks/useTransactions';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/types/finance';

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
  // Inicializa o filtro com TODAS as categorias de despesa
  const initialCategories = EXPENSE_CATEGORIES.map(c => c.id);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);

  // Se o usuário não selecionou nenhuma categoria, tratamos como se todas estivessem selecionadas
  const categoriesToFilter = selectedCategories.length > 0 ? selectedCategories : initialCategories;

  const { 
    isLoading, 
    totalIncome, 
    totalExpenses, 
    balance,
    expensesByCategory,
  } = useTransactions({ 
    selectedDate,
    // Passamos apenas as categorias de despesa selecionadas para o filtro
    filterCategories: categoriesToFilter,
  });

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

      {/* Category Filter */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <CategoryFilter 
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
        />
      </div>

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
        <p className="text-xs text-muted-foreground mt-1 italic">
          * Análise baseada nas categorias selecionadas.
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