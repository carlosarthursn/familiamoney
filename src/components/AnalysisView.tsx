import { useState } from 'react';
import { MonthlyChart } from './MonthlyChart';
import { ExpenseChart } from './ExpenseChart';
import { CategoryFilter } from './CategoryFilter';
import { useTransactions } from '@/hooks/useTransactions';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { BudgetProgress } from './BudgetProgress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/types/finance';
import { ReportsView } from './ReportsView';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [viewMode, setViewMode] = useState<'monthly' | 'range'>('monthly');
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

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Análise Financeira</h2>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-auto">
          <TabsList className="grid grid-cols-2 h-9 w-[180px]">
            <TabsTrigger value="monthly" className="text-xs">Mensal</TabsTrigger>
            <TabsTrigger value="range" className="text-xs">Período</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === 'range' ? (
        <ReportsView />
      ) : (
        <div className="space-y-4 animate-fade-in">
          <p className="text-sm text-muted-foreground font-medium -mb-2">Referente a {monthYear}</p>
          
          {/* Category Filter */}
          <div className="bg-card rounded-xl p-4 shadow-card">
            <CategoryFilter 
              selectedCategories={selectedCategories}
              onCategoriesChange={setSelectedCategories}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Net Flow Summary */}
              <div className="bg-card rounded-xl p-4 shadow-card">
                <h3 className="text-xs font-semibold mb-1 text-muted-foreground uppercase tracking-wider">Fluxo Líquido</h3>
                <div className="flex items-center justify-between">
                  <p className={cn(
                    "text-xl font-bold",
                    (totalIncome - totalExpenses) >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {formatCurrency(totalIncome - totalExpenses)}
                  </p>
                  <div className={cn(
                    "p-1.5 rounded-full",
                    (totalIncome - totalExpenses) >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  )}>
                    {(totalIncome - totalExpenses) >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-card rounded-xl p-4 shadow-card">
                  <h3 className="text-sm font-semibold mb-2">Comparativo</h3>
                  <div className="h-32">
                    <MonthlyChart income={totalIncome} expenses={totalExpenses} />
                  </div>
                </div>

                <div className="bg-card rounded-xl p-4 shadow-card">
                  <h3 className="text-sm font-semibold mb-2">Gastos por Categoria</h3>
                  <ExpenseChart expensesByCategory={expensesByCategory} />
                </div>
              </div>

              {/* Budget Progress */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Orçamento do Mês
                </h3>
                <BudgetProgress selectedDate={selectedDate} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}