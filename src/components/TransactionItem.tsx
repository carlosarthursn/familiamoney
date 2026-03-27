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
    <div className="flex items-center gap-3 p-3 bg-card rounded-xl shadow-sm border border-border/50 group transition-all hover:shadow-md">
      {/* Icon Container */}
      <div className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
        isIncome ? "bg-success/10" : "bg-destructive/10"
      )}>
        <IconComponent className={cn(
          "h-5 w-5",
          isIncome ? "text-success" : "text-destructive"
        )} />
      </div>
      
      {/* Content Container */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-sm text-foreground truncate">
            {categoryInfo.label}
          </p>
          <p className={cn(
            "font-bold text-sm whitespace-nowrap",
            isIncome ? "text-success" : "text-destructive"
          )}>
            {isIncome ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-2 overflow-hidden">
            <p className="text-[11px] text-muted-foreground shrink-0">
              {format(new Date(transaction.date + 'T00:00:00'), "dd 'de' MMM", { locale: ptBR })}
            </p>
            {transaction.author_name && (
              <div className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium truncate",
                transaction.author_name === 'Você' 
                  ? "bg-primary/10 text-primary" 
                  : "bg-muted text-muted-foreground"
              )}>
                <User className="h-2 w-2" />
                <span className="truncate max-w-[60px]">
                  {transaction.author_name}
                </span>
              </div>
            )}
          </div>
          
          {onDelete && (
            <button
              onClick={() => onDelete(transaction.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all touch-target -mr-1"
              aria-label="Excluir transação"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        
        {transaction.description && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5 italic border-t border-border/30 pt-0.5">
            {transaction.description}
          </p>
        )}
      </div>
    </div>
  );
}