import { RecurringExpense } from '@/hooks/useRecurring';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Calendar, CreditCard, Repeat } from 'lucide-react';
import { getCategoryInfo, getCategoryIcon } from '@/types/finance';
import { cn } from '@/lib/utils';

interface RecurringCardProps {
  item: RecurringExpense;
  onDelete: (id: string) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function RecurringCard({ item, onDelete }: RecurringCardProps) {
  const cat = getCategoryInfo(item.category, 'expense');
  const Icon = getCategoryIcon(cat.icon);
  
  return (
    <Card className="shadow-sm border-none bg-card group overflow-hidden">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm truncate">{item.name}</p>
              {item.is_installment && (
                <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-bold">
                  {item.total_installments}x
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Todo dia {item.due_day}
              </span>
              <span className="flex items-center gap-1">
                {item.is_installment ? <CreditCard className="h-3 w-3" /> : <Repeat className="h-3 w-3" />}
                {item.is_installment ? 'Parcelado' : 'Fixo'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <p className="font-black text-sm text-foreground">{formatCurrency(item.amount)}</p>
          <button 
            onClick={() => onDelete(item.id)}
            className="p-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}