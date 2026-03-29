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
      "shadow-sm border-none bg-card group overflow-hidden transition-all",
      !item.is_active && "opacity-50 grayscale",
      isPaid ? "bg-success/5 border border-success/20" : (!isIncome ? "border-l-4 border-l-destructive bg-destructive/5" : "bg-muted/10")
    )}>
      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Nome do Lançamento</span>
                <Input 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  className="h-11 rounded-xl font-bold"
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Valor (R$)</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">R$</span>
                  <Input 
                    type="text"
                    inputMode="decimal"
                    value={editAmount} 
                    onChange={e => setEditAmount(e.target.value.replace(/[^0-9,.]/g, ''))} 
                    className="h-11 pl-10 rounded-xl font-black text-lg"
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} 
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
              >
                <X className="h-4 w-4" /> Cancelar
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleSave(); }} 
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-black rounded-xl shadow-md active:scale-95 transition-all"
              >
                <Check className="h-4 w-4" /> Salvar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between" onClick={() => setIsEditing(true)}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                isIncome ? "bg-success/10" : (isPaid ? "bg-success/20" : "bg-destructive/20")
              )}>
                <Icon className={cn(
                  "h-5 w-5", 
                  isIncome ? "text-success" : (isPaid ? "text-success" : "text-destructive")
                )} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm truncate">{item.name}</p>
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
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Dia {item.due_day}
                  </span>
                  {item.is_installment && !isIncome && (
                    <span className="font-bold text-primary">Parcela {item.current_installment}/{item.total_installments}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <div className="text-right mr-1">
                <p className={cn(
                  "font-black text-sm", 
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
                    "p-2 rounded-full transition-colors active:scale-90",
                    isPaid ? "text-success hover:bg-success/10" : "text-primary hover:bg-primary/10"
                  )}
                >
                  {isPendingAction ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <CheckCircle2 className={cn("h-6 w-6", isPaid && "fill-success/20")} />
                  )}
                </button>
              )}

              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="p-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}