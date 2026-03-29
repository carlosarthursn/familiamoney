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
    <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/50 rounded-xl border border-dashed border-border">
      <Icon className="h-8 w-8 text-muted-foreground mb-3" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>
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

  // Lógica para verificar se o item já foi pago no mês atual
  const paidItemsMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    transactions.forEach(t => {
      // Tenta encontrar o nome do item recorrente na descrição da transação
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
    <div className="space-y-8 animate-fade-in pb-20">
      {showSuccess && <SuccessOverlay message={successMessage} onFinished={() => setShowSuccess(false)} />}

      <h2 className="text-2xl font-black tracking-tight">Planejamento</h2>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="font-bold flex items-center gap-2 text-base">
              <Repeat className="h-5 w-5 text-primary" /> Lançamentos Fixos
            </h3>
            <p className="text-[10px] text-muted-foreground">Clique no item para editar ou no check para lançar</p>
          </div>
          <AddRecurringSheet />
        </div>
        
        {isLoadingRec ? (
          <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : recurring.length === 0 ? (
          <EmptyState 
            icon={Repeat} title="Nada planejado" description="Cadastre seus ganhos e gastos fixos mensais."
            trigger={<AddRecurringSheet />}
          />
        ) : (
          <div className="space-y-6">
            {recurringIncomes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                    <span className="text-[10px] font-bold text-success uppercase tracking-widest">Recebimentos Fixos</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">{formatCurrency(paidIncomes)} / {formatCurrency(totalIncomes)}</span>
                </div>
                <div className="space-y-2">
                  {recurringIncomes.map(item => (
                    <RecurringCard key={item.id} item={item} onDelete={handleDeleteRec} isPaid={paidItemsMap[item.id]} />
                  ))}
                  <div className="p-3 bg-muted/20 rounded-xl flex justify-between items-center border border-dashed border-border">
                    <span className="text-xs font-bold text-muted-foreground">TOTAL GANHOS</span>
                    <span className="text-sm font-black text-success">{formatCurrency(totalIncomes)}</span>
                  </div>
                </div>
              </div>
            )}

            {recurringExpenses.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-[10px] font-bold text-destructive uppercase tracking-widest">Contas Fixas</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">{formatCurrency(paidExpenses)} / {formatCurrency(totalExpenses)}</span>
                </div>
                <div className="space-y-2">
                  {recurringExpenses.map(item => (
                    <RecurringCard key={item.id} item={item} onDelete={handleDeleteRec} isPaid={paidItemsMap[item.id]} />
                  ))}
                  <div className="p-3 bg-muted/20 rounded-xl flex justify-between items-center border border-dashed border-border">
                    <span className="text-xs font-bold text-muted-foreground">TOTAL GASTOS</span>
                    <span className="text-sm font-black text-destructive">{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {inactiveRecurring.length > 0 && (
              <div className="pt-4 border-t border-border">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">Finalizados</p>
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-primary" /> Metas de Poupança
          </h3>
          <AddGoalSheet />
        </div>
        {isLoadingGoals ? (
          <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : goals.length === 0 ? (
          <EmptyState icon={Target} title="Nenhuma meta" description="Comece a planejar seu futuro." trigger={<AddGoalSheet />} />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {goals.map(goal => <SavingsGoalCard key={goal.id} goal={goal} onDelete={handleDeleteGoal} />)}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2 text-base">
            <ListChecks className="h-5 w-5 text-primary" /> Lista de Desejos
          </h3>
          <AddWishItemSheet />
        </div>
        {isLoadingWishList ? (
          <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : wishList.length === 0 ? (
          <EmptyState icon={ListChecks} title="Lista vazia" description="O que você quer comprar em breve?" trigger={<AddWishItemSheet />} />
        ) : (
          <div className="space-y-2">
            {wishList.map(item => <WishListItemCard key={item.id} item={item} onDelete={handleDeleteWishItem} />)}
          </div>
        )}
      </div>
    </div>
  );
}