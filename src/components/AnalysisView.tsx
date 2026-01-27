import { useState } from 'react';
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
  const initialCategories = EXPENSE_CATEGORIES.map(c => c.id);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);

  const categoriesToFilter = selectedCategories.length > 0 ? selectedCategories : initialCategories;

  const { 
    isLoading, 
    totalIncome, 
    totalExpenses, 
    expensesByCategory,
  } = useTransactions({ 
    selectedDate,
    filterCategories: categoriesToFilter,
  });

  const monthYear = format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const netFlow = totalIncome - totalExpenses;

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-lg font-bold">Análise de {monthYear}</h2>

      {/* Category Filter */}
      <div className="bg-card rounded-xl p-4 shadow-card"> {/* Aumentando o padding aqui */}
        <CategoryFilter 
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
        />
      </div>

      {/* Net Flow Summary */}
      <div className="bg-card rounded-xl p-4 shadow-card"> {/* Aumentando o padding aqui */}
        <h3 className="text-xs font-semibold mb-1 text-muted-foreground uppercase tracking-wider">Fluxo Líquido</h3>
        <div className="flex items-center justify-between">
          <p className={cn(
            "text-xl font-bold",
            netFlow >= 0 ? "text-success" : "text-destructive"
          )}>
            {formatCurrency(netFlow)}
          </p>
          <div className={cn(
            "p-1.5 rounded-full",
            netFlow >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            {netFlow >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 italic">
          * Baseado nas categorias selecionadas.
        </p>
      </div>

      {/* Charts Grid - Compact for mobile */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-card"> {/* Aumentando o padding aqui */}
          <h3 className="text-sm font-semibold mb-2">Comparativo</h3>
          <div className="h-32">
            <MonthlyChart income={totalIncome} expenses={totalExpenses} />
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-card"> {/* Aumentando o padding aqui */}
          <h3 className="text-sm font-semibold mb-2">Gastos por Categoria</h3>
          <ExpenseChart expensesByCategory={expensesByCategory} />
        </div>
      </div>
    </div>
  );
}