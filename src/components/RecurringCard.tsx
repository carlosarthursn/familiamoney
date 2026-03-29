import { RecurringExpense, useRecurring } from '@/hooks/useRecurring';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Calendar, CheckCircle2, ArrowUpCircle, Loader2 } from 'lucide-react';
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
  const { markAsPaid } = useRecurring();
  const isIncome = item.type === 'income';
  const cat = getCategoryInfo(item.category, isIncome ? 'income' : 'expense');
  const Icon = getCategoryIcon(cat.icon);
  
  const handlePaid = () => {
    markAsPaid.mutate(item);
  };

  return (
    <Card className={cn(
      "shadow-sm border-none bg-card group overflow-hidden transition-all",
      !item.is_active && "opacity-50 grayscale"
    )}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
            isIncome ? "bg-success/10" : "bg-muted/50"
          )}>
            <Icon className={cn("h-5 w-5", isIncome ? "text-success" : "text-muted-foreground")} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm truncate">{item.name}</p>
              {isIncome ? (
                <ArrowUpCircle className="h-3 w-3 text-success" />
              ) : (
                item.is_installment && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-bold">
                    {item.current_installment}/{item.total_installments}x
                  </span>
                )
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Todo dia {item.due_day}
              </span>
              <span className="flex items-center gap-1 font-medium">
                {isIncome ? 'Recorrente' : item.is_installment ? 'Parcelado' : 'Fixo'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-right mr-1">
            <p className={cn("font-black text-sm", isIncome ? "text-success" : "text-foreground")}>
              {isIncome ? '+' : ''}{formatCurrency(item.amount)}
            </p>
          </div>

          {item.is_active && (
            <button
              onClick={handlePaid}
              disabled={markAsPaid.isPending}
              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors active:scale-90"
              title={isIncome ? "Marcar como Recebido" : "Marcar como Pago"}
            >
              {markAsPaid.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </button>
          )}

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