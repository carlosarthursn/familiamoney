import { useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, startOfMonth, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTransactions } from '@/hooks/useTransactions';
import { useRecurring } from '@/hooks/useRecurring';
import { Loader2, CalendarClock, TrendingUp, TrendingDown } from 'lucide-react';
import { TransactionList } from './TransactionList';
import { toast } from 'sonner';
import { SuccessOverlay } from './SuccessOverlay';
import { getCategoryInfo, getCategoryIcon } from '@/types/finance';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function CalendarView({ selectedDate, onDateChange }: CalendarViewProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const { transactions, isLoading, deleteTransaction } = useTransactions({ selectedDate });
  const { recurring } = useRecurring();

  const modifiers = useMemo(() => {
    const hasIncome: Date[] = [];
    const hasExpense: Date[] = [];
    const hasBoth: Date[] = [];
    const hasRecIncome: Date[] = [];
    const hasRecExpense: Date[] = [];
    const hasRecBoth: Date[] = [];
    
    const dayMap: Record<string, { income: boolean, expense: boolean }> = {};
    transactions.forEach(t => {
      if (!dayMap[t.date]) dayMap[t.date] = { income: false, expense: false };
      if (t.type === 'income') dayMap[t.date].income = true;
      if (t.type === 'expense') dayMap[t.date].expense = true;
    });

    Object.entries(dayMap).forEach(([dateStr, types]) => {
      const date = new Date(dateStr + 'T00:00:00');
      if (types.income && types.expense) hasBoth.push(date);
      else if (types.income) hasIncome.push(date);
      else if (types.expense) hasExpense.push(date);
    });

    const recDayMap: Record<number, { income: boolean, expense: boolean }> = {};
    recurring.forEach(item => {
      if (item.is_active) {
        if (!recDayMap[item.due_day]) recDayMap[item.due_day] = { income: false, expense: false };
        if (item.type === 'income') recDayMap[item.due_day].income = true;
        else recDayMap[item.due_day].expense = true;
      }
    });

    const currentMonth = startOfMonth(selectedDate);
    Object.entries(recDayMap).forEach(([day, types]) => {
      const dueDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), parseInt(day));
      if (types.income && types.expense) hasRecBoth.push(dueDate);
      else if (types.income) hasRecIncome.push(dueDate);
      else if (types.expense) hasRecExpense.push(dueDate);
    });

    return { hasIncome, hasExpense, hasBoth, hasRecIncome, hasRecExpense, hasRecBoth };
  }, [transactions, recurring, selectedDate]);

  const transactionsForSelectedDay = transactions.filter(t => 
    isSameDay(new Date(t.date + 'T00:00:00'), selectedDate)
  );

  const recurringForSelectedDay = recurring.filter(item => 
    item.due_day === getDate(selectedDate) && item.is_active
  );

  const recurringIncome = recurringForSelectedDay.filter(item => item.type === 'income');
  const recurringExpense = recurringForSelectedDay.filter(item => item.type === 'expense');

  const totalRecurringExpense = recurringExpense.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalRecurringIncome = recurringIncome.reduce((sum, item) => sum + Number(item.amount), 0);
  
  const handleDelete = (id: string) => {
    deleteTransaction.mutate(id, {
      onSuccess: () => setShowSuccess(true),
      onError: () => toast.error('Erro ao remover'),
    });
  };

  return (
    <div className="space-y-4 max-w-sm mx-auto w-full pb-10">
      {showSuccess && (
        <SuccessOverlay 
          message="Transação removida!" 
          onFinished={() => setShowSuccess(false)} 
        />
      )}

      <div className="bg-card rounded-2xl p-2 shadow-card flex justify-center overflow-hidden">
        <Calendar
          mode="single"
          month={startOfMonth(selectedDate)}
          onMonthChange={onDateChange}
          selected={selectedDate}
          onSelect={(date) => {
            if (date) onDateChange(date);
          }}
          locale={ptBR}
          className="w-full flex justify-center"
          modifiers={modifiers}
          modifiersClassNames={{
            hasIncome: "day-has-income",
            hasExpense: "day-has-expense",
            hasBoth: "day-has-both",
            hasRecIncome: "day-has-rec-income",
            hasRecExpense: "day-has-rec-expense",
            hasRecBoth: "day-has-rec-both",
          }}
        />
      </div>
      
      {recurringForSelectedDay.length > 0 && (
        <div className="bg-muted/30 border border-border rounded-2xl p-4 animate-slide-up space-y-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Planejado p/ hoje</h3>
          </div>

          <div className="space-y-3">
            {/* Ganhos */}
            {recurringIncome.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-success uppercase flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Recebimentos
                </p>
                {recurringIncome.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-card p-2.5 rounded-xl border border-success/10">
                    <span className="text-xs font-semibold">{item.name}</span>
                    <span className="text-xs font-black text-success">+{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Gastos */}
            {recurringExpense.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-destructive uppercase flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Contas a Pagar
                </p>
                {recurringExpense.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-card p-2.5 rounded-xl border border-destructive/10">
                    <span className="text-xs font-semibold">{item.name}</span>
                    <span className="text-xs font-black">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="pt-3 border-t border-border flex justify-between">
            <div className="text-center flex-1 border-r border-border">
              <p className="text-[9px] text-muted-foreground uppercase">Total Ganhos</p>
              <p className="text-sm font-black text-success">{formatCurrency(totalRecurringIncome)}</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-[9px] text-muted-foreground uppercase">Total Gastos</p>
              <p className="text-sm font-black text-destructive">{formatCurrency(totalRecurringExpense)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
          Movimentações Realizadas — {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
        </h3>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <TransactionList 
            transactions={transactionsForSelectedDay} 
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}