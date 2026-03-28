import { useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, startOfMonth, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTransactions } from '@/hooks/useTransactions';
import { useRecurring } from '@/hooks/useRecurring';
import { Loader2, CalendarClock } from 'lucide-react';
import { TransactionList } from './TransactionList';
import { toast } from 'sonner';
import { SuccessOverlay } from './SuccessOverlay';
import { getCategoryInfo, getCategoryIcon } from '@/types/finance';

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
    const hasRecurring: Date[] = [];
    
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

    const currentMonth = startOfMonth(selectedDate);
    recurring.forEach(item => {
      if (item.is_active) {
        const dueDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), item.due_day);
        hasRecurring.push(dueDate);
      }
    });

    return { hasIncome, hasExpense, hasBoth, hasRecurring };
  }, [transactions, recurring, selectedDate]);

  const transactionsForSelectedDay = transactions.filter(t => 
    isSameDay(new Date(t.date + 'T00:00:00'), selectedDate)
  );

  const recurringForSelectedDay = recurring.filter(item => 
    item.due_day === getDate(selectedDate) && item.is_active
  );

  const totalRecurringForDay = useMemo(() => {
    return recurringForSelectedDay.reduce((sum, item) => sum + Number(item.amount), 0);
  }, [recurringForSelectedDay]);
  
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
            hasRecurring: "day-has-recurring",
          }}
        />
      </div>
      
      {recurringForSelectedDay.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-xs text-primary uppercase tracking-wider">Contas para hoje</h3>
          </div>
          <div className="space-y-2">
            {recurringForSelectedDay.map(item => {
              const cat = getCategoryInfo(item.category, 'expense');
              const Icon = getCategoryIcon(cat.icon);
              return (
                <div key={item.id} className="flex items-center justify-between bg-card p-2.5 rounded-xl border border-primary/10">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold">{item.name}</span>
                  </div>
                  <span className="text-xs font-black">{formatCurrency(item.amount)}</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-2 border-t border-primary/10 mt-2 px-1">
              <span className="text-[10px] font-bold text-primary uppercase">Total Previsto</span>
              <span className="text-sm font-black text-primary">{formatCurrency(totalRecurringForDay)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
          Movimentações — {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
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