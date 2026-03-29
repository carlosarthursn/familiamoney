import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { EXPENSE_CATEGORIES, getCategoryIcon } from '@/types/finance';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface BudgetRow {
  id: string;
  category: string;
  monthly_limit: number;
  user_id: string;
  custom_label: string | null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface BudgetProgressProps {
  selectedDate: Date;
}

export function BudgetProgress({ selectedDate }: BudgetProgressProps) {
  const { user, profile } = useAuth();
  const { expensesByCategory } = useTransactions({ selectedDate });

  const userIds = [user?.id].filter(Boolean) as string[];
  if (profile?.linked_user_id) userIds.push(profile.linked_user_id);

  const cacheKey = `confere_budgets_${userIds.sort().join(',')}`;

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', userIds.sort().join(',')],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase
        .from('budgets' as any)
        .select('*')
        .in('user_id', userIds);
      if (error) throw error;
      
      // Agrupamos por categoria. Se houver nomes personalizados, eles prevalecem.
      const consolidated: Record<string, { limit: number, label: string | null }> = {};
      (data as unknown as BudgetRow[]).forEach(b => {
        if (!consolidated[b.category] || b.monthly_limit > consolidated[b.category].limit) {
          consolidated[b.category] = { 
            limit: b.monthly_limit, 
            label: b.custom_label 
          };
        }
      });
      
      const formatted = Object.entries(consolidated).map(([cat, data]) => ({
        id: cat,
        category: cat,
        monthly_limit: data.limit,
        custom_label: data.label
      }));

      try { localStorage.setItem(cacheKey, JSON.stringify(formatted)); } catch(e) {}
      return formatted;
    },
    initialData: () => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (e) {}
      return undefined;
    },
    enabled: !!user,
  });

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!budgets || budgets.length === 0) return null;

  return (
    <div className="space-y-3">
      {budgets.map(budget => {
        const catInfo = EXPENSE_CATEGORIES.find(c => c.id === budget.category);
        if (!catInfo) return null;
        
        const Icon = getCategoryIcon(catInfo.icon);
        const spent = expensesByCategory[budget.category] || 0;
        const percentage = Math.min(100, (spent / budget.monthly_limit) * 100);
        const isOver = spent > budget.monthly_limit;
        const displayName = budget.custom_label || catInfo.label;

        return (
          <div key={budget.id} className="bg-card rounded-xl p-3 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium flex-1 truncate">{displayName}</span>
              <span className={cn("text-xs font-semibold shrink-0", isOver ? "text-destructive" : "text-muted-foreground")}>
                {formatCurrency(spent)} / {formatCurrency(budget.monthly_limit)}
              </span>
            </div>
            <Progress value={percentage} className={cn("h-2", isOver && "[&>div]:bg-destructive")} />
          </div>
        );
      })}
    </div>
  );
}