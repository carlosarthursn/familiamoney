import { Trash2, User } from 'lucide-react';
import { Transaction, getCategoryInfo, getCategoryIcon } from '@/types/finance';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TransactionItemProps {
  transaction: Transaction & { author_name?: string };
  onDelete?: (id: string) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function TransactionItem({ transaction, onDelete }: TransactionItemProps) {
  const categoryInfo = getCategoryInfo(transaction.category, transaction.type);
  const IconComponent = getCategoryIcon(categoryInfo.icon);
  const isIncome = transaction.type === 'income';
  
  return (
    <div className="flex items-center gap-3 p-4 bg-card rounded-xl shadow-card group transition-all hover:shadow-card-hover">
      <div className={cn(
        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
        isIncome ? "bg-success/10" : "bg-destructive/10"
      )}>
        <IconComponent className={cn(
          "h-5 w-5",
          isIncome ? "text-success" : "text-destructive"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">
          {categoryInfo.label}
        </p>
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-muted-foreground">
            {format(new Date(transaction.date), "dd 'de' MMM", { locale: ptBR })}
          </p>
          {transaction.user_id && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground">
              <User className="h-2 w-2" />
              <span className="truncate max-w-[60px]">
                {transaction.user_id.slice(0, 4)}...
              </span>
            </div>
          )}
        </div>
        {transaction.description && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5 italic">
            {transaction.description}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <p className={cn(
          "font-semibold text-right",
          isIncome ? "text-success" : "text-destructive"
        )}>
          {isIncome ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
        </p>
        
        {onDelete && (
          <button
            onClick={() => onDelete(transaction.id)}
            className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive transition-all touch-target"
            aria-label="Excluir transação"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}