import { useState } from 'react';
import { RecurringExpense, useRecurring } from '@/hooks/useRecurring';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Calendar, CheckCircle2, Loader2, X, Check, AlertCircle } from 'lucide-react';
import { getCategoryInfo, getCategoryIcon } from '@/types/finance';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface RecurringCardProps {
  item: RecurringExpense;
  onDelete: (id: string) => void;
  isPaid?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function RecurringCard({ item, onDelete, isPaid }: RecurringCardProps) {
  const { markAsPaid, unmarkAsPaid, updateRecurring } = useRecurring();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editAmount, setEditAmount] = useState(String(item.amount));
  
  const isIncome = item.type === 'income';
  const cat = getCategoryInfo(item.category, isIncome ? 'income' : 'expense');
  const Icon = getCategoryIcon(cat.icon);
  
  const handleSave = () => {
    const amount = parseFloat(editAmount.replace(',', '.'));
    if (isNaN(amount)) return;
    
    updateRecurring.mutate({ 
      id: item.id, 
      name: editName, 
      amount: amount 
    });
    setIsEditing(false);
  };

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPaid) {
      unmarkAsPaid.mutate(item);
    } else {
      markAsPaid.mutate(item);
    }
  };

  const isPendingAction = markAsPaid.isPending || unmarkAsPaid.isPending;

  return (
    <Card className={cn(
      "shadow-sm border-none bg-card group overflow-hidden transition-all active:scale-[0.98]",
      !item.is_active && "opacity-50 grayscale",
      isPaid ? "bg-success/5 border border-success/10" : (!isIncome ? "border-l-4 border-l-destructive bg-destructive/5" : "bg-muted/10")
    )}>
      <CardContent className="p-3 sm:p-4">
        {isEditing ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Nome</span>
                <Input 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  className="h-10 rounded-xl font-bold"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Valor</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">R$</span>
                  <Input 
                    type="text"
                    inputMode="decimal"
                    value={editAmount} 
                    onChange={e => setEditAmount(e.target.value.replace(/[^0-9,.]/g, ''))} 
                    className="h-10 pl-9 rounded-xl font-black text-base"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} 
                className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleSave(); }} 
                className="px-4 py-1.5 bg-primary text-white text-xs font-black rounded-lg shadow-md"
              >
                Salvar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3" onClick={() => setIsEditing(true)}>
            {/* Ícone menor no mobile */}
            <div className={cn(
              "h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0",
              isIncome ? "bg-success/10" : (isPaid ? "bg-success/20" : "bg-destructive/20")
            )}>
              <Icon className={cn(
                "h-4 w-4 sm:h-5 sm:w-5", 
                isIncome ? "text-success" : (isPaid ? "text-success" : "text-destructive")
              )} />
            </div>

            {/* Conteúdo Central - Flex Grow para ocupar espaço */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="font-bold text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{item.name}</p>
                {isPaid ? (
                  <span className="text-[8px] font-black uppercase text-success bg-success/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Check className="h-2 w-2" /> Pago
                  </span>
                ) : !isIncome && (
                  <span className="text-[8px] font-black uppercase text-destructive bg-destructive/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <AlertCircle className="h-2 w-2" /> Pendente
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Dia {item.due_day}
                </span>
                {item.is_installment && !isIncome && (
                  <span className="font-bold text-primary">Parcela {item.current_installment}/{item.total_installments}</span>
                )}
              </div>
            </div>
            
            {/* Lado Direito - Valor e Ação */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              <div className="text-right">
                <p className={cn(
                  "font-black text-xs sm:text-sm whitespace-nowrap", 
                  isIncome ? "text-success" : (isPaid ? "text-success" : "text-destructive")
                )}>
                  {isIncome ? '+' : ''}{formatCurrency(item.amount)}
                </p>
              </div>

              {item.is_active && (
                <button
                  onClick={handleToggleStatus}
                  disabled={isPendingAction}
                  className={cn(
                    "p-1.5 sm:p-2 rounded-full transition-all active:scale-90",
                    isPaid ? "text-success" : "text-primary"
                  )}
                >
                  {isPendingAction ? (
                    <Loader2 className="h-5 w-5 sm:h-6 sm:h-6 animate-spin" />
                  ) : (
                    <CheckCircle2 className={cn("h-5 w-5 sm:h-6 sm:h-6", isPaid && "fill-success/20")} />
                  )}
                </button>
              )}

              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}