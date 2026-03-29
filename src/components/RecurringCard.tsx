import { useState } from 'react';
import { RecurringExpense, useRecurring } from '@/hooks/useRecurring';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Calendar, CheckCircle2, ArrowUpCircle, Loader2, Edit3, X, Check } from 'lucide-react';
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
  const { markAsPaid, updateRecurring } = useRecurring();
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

  return (
    <Card className={cn(
      "shadow-sm border-none bg-card group overflow-hidden transition-all",
      !item.is_active && "opacity-50 grayscale",
      isPaid && "bg-success/5 border border-success/20"
    )}>
      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
            <div className="flex gap-2">
              <Input 
                value={editName} 
                onChange={e => setEditName(e.target.value)} 
                className="h-9 text-xs font-bold"
                placeholder="Nome"
              />
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">R$</span>
                <Input 
                  value={editAmount} 
                  onChange={e => setEditAmount(e.target.value)} 
                  className="h-9 pl-7 text-xs font-bold"
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditing(false)} className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg">
                <X className="h-4 w-4" />
              </button>
              <button onClick={handleSave} className="p-1.5 bg-primary text-white rounded-lg">
                <Check className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1" onClick={() => setIsEditing(true)}>
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                isIncome ? "bg-success/10" : "bg-muted/50",
                isPaid && "bg-success/20"
              )}>
                <Icon className={cn("h-5 w-5", isIncome ? "text-success" : "text-muted-foreground", isPaid && "text-success")} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm truncate">{item.name}</p>
                  {isPaid && <span className="text-[8px] font-black uppercase text-success bg-success/10 px-1.5 rounded-full">Lançado</span>}
                  {item.is_installment && !isIncome && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-bold">
                      {item.current_installment}/{item.total_installments}x
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Dia {item.due_day}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <div className="text-right mr-1">
                <p className={cn("font-black text-sm", isIncome ? "text-success" : "text-foreground", isPaid && "text-success")}>
                  {isIncome ? '+' : ''}{formatCurrency(item.amount)}
                </p>
              </div>

              {!isPaid && item.is_active && (
                <button
                  onClick={(e) => { e.stopPropagation(); markAsPaid.mutate(item); }}
                  disabled={markAsPaid.isPending}
                  className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors active:scale-90"
                >
                  {markAsPaid.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
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