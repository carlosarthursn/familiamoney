"use client";

import { useState } from 'react';
import { Trash2, User } from 'lucide-react';
import { Transaction, getCategoryInfo, getCategoryIcon } from '@/types/finance';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(transaction.description || categoryInfo.label);
  const [editAmount, setEditAmount] = useState(String(transaction.amount));

  const queryClient = useQueryClient();
  const updateTransaction = useMutation({
    mutationFn: async (args: { id: string, description: string | null, amount: number }) => {
      const { error } = await supabase.from('transactions').update({
        description: args.description,
        amount: args.amount
      }).eq('id', args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dateRangeTransactions'] });
    }
  });

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const numAmount = parseFloat(editAmount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numAmount)) return;
    updateTransaction.mutate({
      id: transaction.id,
      description: editName.trim() || null,
      amount: numAmount
    });
    setIsEditing(false);
  };
  
  return (
    <div className="p-3 bg-card rounded-xl shadow-sm border border-border/50 group transition-all hover:shadow-md">
      {isEditing ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Nome</span>
              <Input 
                value={editName} 
                onChange={e => setEditName(e.target.value)} 
                className="h-10 rounded-xl font-bold bg-background/80 border border-border/50"
                onClick={e => e.stopPropagation()}
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
                  className="h-10 pl-9 rounded-xl font-black text-base bg-background/80 border border-border/50"
                  onClick={e => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} 
              className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              className="px-4 py-1.5 bg-primary text-white text-xs font-black rounded-lg shadow-md hover:bg-primary/90 transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform" 
          onClick={() => setIsEditing(true)}
        >
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
                  onClick={(e) => { e.stopPropagation(); onDelete(transaction.id); }}
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
      )}
    </div>
  );
}