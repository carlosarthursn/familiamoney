"use client";

import { useState, useMemo } from 'react';
import { SavingsGoalCard } from './SavingsGoalCard';
import { WishListItemCard } from './WishListItemCard';
import { RecurringCard } from './RecurringCard';
import { AddRecurringSheet } from './AddRecurringSheet';
import { ListChecks, Target, Repeat, Loader2, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { usePlanning } from '@/hooks/usePlanning';
import { useRecurring } from '@/hooks/useRecurring';
import { useTransactions } from '@/hooks/useTransactions';
import { AddGoalSheet } from './AddGoalSheet';
import { AddWishItemSheet } from './AddWishItemSheet';
import { SuccessOverlay } from './SuccessOverlay';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function EmptyState({ icon: Icon, title, description, trigger }: { icon: React.ElementType, title: string, description: string, trigger: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center bg-muted/20 rounded-[2rem] border border-dashed border-border/60">
      <div className="h-14 w-14 rounded-full bg-background flex items-center justify-center mb-4 shadow-sm">
        <Icon className="h-7 w-7 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-black text-foreground mb-1">{title}</p>
      <p className="text-[11px] text-muted-foreground mb-6 max-w-[200px]">{description}</p>
      {trigger}
    </div>
  );
}

export function PlanningView() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { goals, isLoadingGoals, deleteGoal, wishList, isLoadingWishList, deleteItem } = usePlanning();
  const { recurring, isLoading: isLoadingRec, deleteRecurring } = useRecurring();
  const { transactions } = useTransactions();

  const handleDeleteGoal = (id: string) => {
    deleteGoal.mutate(id, {
      onSuccess: () => { setSuccessMessage('Meta removida!'); setShowSuccess(true); },
    });
  };
  
  const handleDeleteWishItem = (id: string) => {
    deleteItem.mutate(id, {
      onSuccess: () => { setSuccessMessage('Item removido!'); setShowSuccess(true); },
    });
  };

  const handleDeleteRec = (id: string) => {
    deleteRecurring.mutate(id, {
      onSuccess: () => { setSuccessMessage('Planejamento removido!'); setShowSuccess(true); },
    });
  };

  const activeRecurring = recurring.filter(r => r.is_active);
  const inactiveRecurring = recurring.filter(r => !r.is_active);

  const recurringIncomes = activeRecurring.filter(r => r.type === 'income');
  const recurringExpenses = activeRecurring.filter(r => r.type === 'expense');

  const paidItemsMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    transactions.forEach(t => {
      activeRecurring.forEach(r => {
        if (t.description?.includes(r.name)) {
          map[r.id] = true;
        }
      });
    });
    return map;
  }, [transactions, activeRecurring]);

  const totalIncomes = recurringIncomes.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalExpenses = recurringExpenses.reduce((sum, r) => sum + Number(r.amount), 0);
  const paidExpenses = recurringExpenses.filter(r => paidItemsMap[r.id]).reduce((sum, r) => sum + Number(r.amount), 0);
  const paidIncomes = recurringIncomes.filter(r => paidItemsMap[r.id]).reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="space-y-10 animate-fade-in pb-20 max-w-md mx-auto">
      {showSuccess && <SuccessOverlay message={successMessage} onFinished={() => { setShowSuccess(false); setSuccessMessage(''); }} />}

      <h2 className="text-3xl font-black tracking-tighter px-1">Planejamento</h2>

      {/* Lançamentos Fixos Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col">
            <h3 className="font-black flex items-center gap-2 text-lg">
              <Repeat className="h-5 w-5 text-primary" /> Lançamentos Fixos
            </h3>
            <p className="text-[10px] text-muted-foreground font-medium">Toque para editar ou no check para lançar</p>
          </div>
          <AddRecurringSheet />
        </div>
        
        {isLoadingRec ? (
          <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : recurring.length === 0 ? (
          <EmptyState 
            icon={Repeat} title="Nada planejado ainda" description="Cadastre seus ganhos e gastos que se repetem todo mês."
            trigger={<AddRecurringSheet />}
          />
        ) : (
          <div className="space-y-8">
            {recurringIncomes.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                    <span className="text-[10px] font-black text-success uppercase tracking-widest">Recebimentos Fixos</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full self-start sm:self-auto">
                    {formatCurrency(paidIncomes)} / {formatCurrency(totalIncomes)}
                  </span>
                </div>
                <div className="space-y-2">
                  {recurringIncomes.map(item => (
                    <RecurringCard key={item.id} item={item} onDelete={handleDeleteRec} isPaid={paidItemsMap[item.id]} />
                  ))}
                  <div className="p-4 bg-muted/20 rounded-2xl flex justify-between items-center border border-dashed border-border/60">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">TOTAL GANHOS</span>
                    <span className="text-base font-black text-success">{formatCurrency(totalIncomes)}</span>
                  </div>
                </div>
              </div>
            )}

            {recurringExpenses.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-[10px] font-black text-destructive uppercase tracking-widest">Contas Fixas</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full self-start sm:self-auto">
                    {formatCurrency(paidExpenses)} / {formatCurrency(totalExpenses)}
                  </span>
                </div>
                <div className="space-y-2">
                  {recurringExpenses.map(item => (
                    <RecurringCard key={item.id} item={item} onDelete={handleDeleteRec} isPaid={paidItemsMap[item.id]} />
                  ))}
                  <div className="p-4 bg-muted/20 rounded-2xl flex justify-between items-center border border-dashed border-border/60">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">TOTAL GASTOS</span>
                    <span className="text-base font-black text-destructive">{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {inactiveRecurring.length > 0 && (
              <div className="pt-6 border-t border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-3 px-1">Finalizados</p>
                <div className="space-y-2">
                  {inactiveRecurring.map(item => (
                    <RecurringCard key={item.id} item={item} onDelete={handleDeleteRec} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metas Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-black flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" /> Metas de Poupança
          </h3>
          <AddGoalSheet />
        </div>
        {isLoadingGoals ? (
          <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : goals.length === 0 ? (
          <EmptyState 
            icon={Target} title="Nenhuma meta de poupança" description="Qual o seu próximo grande sonho? Comece a planejar aqui." 
            trigger={<AddGoalSheet />} 
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {goals.map(goal => <SavingsGoalCard key={goal.id} goal={goal} onDelete={handleDeleteGoal} />)}
          </div>
        )}
      </div>

      {/* Desejos Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-black flex items-center gap-2 text-lg">
            <ListChecks className="h-5 w-5 text-primary" /> Lista de Desejos
          </h3>
          <AddWishItemSheet />
        </div>
        {isLoadingWishList ? (
          <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : wishList.length === 0 ? (
          <EmptyState 
            icon={ListChecks} title="Lista de desejos vazia" description="O que você quer comprar em breve? Adicione aqui para não esquecer." 
            trigger={<AddWishItemSheet />} 
          />
        ) : (
          <div className="space-y-3">
            {wishList.map(item => <WishListItemCard key={item.id} item={item} onDelete={handleDeleteWishItem} />)}
          </div>
        )}
      </div>
    </div>
  );
}