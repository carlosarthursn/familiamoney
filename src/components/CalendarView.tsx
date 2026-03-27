import { useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTransactions } from '@/hooks/useTransactions';
import { Loader2 } from 'lucide-react';
import { TransactionList } from './TransactionList';
import { toast } from 'sonner';

interface CalendarViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function CalendarView({ selectedDate, onDateChange }: CalendarViewProps) {
  const { transactions, isLoading, deleteTransaction } = useTransactions({ selectedDate });

  // Agrupando transações por dia e tipo
  const modifiers = useMemo(() => {
    if (isLoading || !transactions) return { hasIncome: [], hasExpense: [], hasBoth: [] };
    
    const incomeDates: Date[] = [];
    const expenseDates: Date[] = [];
    const bothDates: Date[] = [];
    
    const dayMap: Record<string, { income: boolean, expense: boolean }> = {};
    
    transactions.forEach(t => {
      if (!dayMap[t.date]) dayMap[t.date] = { income: false, expense: false };
      if (t.type === 'income') dayMap[t.date].income = true;
      if (t.type === 'expense') dayMap[t.date].expense = true;
    });

    Object.entries(dayMap).forEach(([dateStr, types]) => {
      const date = new Date(dateStr + 'T00:00:00');
      if (types.income && types.expense) bothDates.push(date);
      else if (types.income) incomeDates.push(date);
      else if (types.expense) expenseDates.push(date);
    });

    return {
      hasIncome: incomeDates,
      hasExpense: expenseDates,
      hasBoth: bothDates,
    };
  }, [transactions, isLoading]);

  const handleMonthChange = (newMonth: Date) => {
    onDateChange(startOfMonth(newMonth));
  };

  const transactionsForSelectedDay = transactions.filter(t => 
    isSameDay(new Date(t.date + 'T00:00:00'), selectedDate)
  );
  
  const handleDelete = (id: string) => {
    deleteTransaction.mutate(id, {
      onSuccess: () => toast.success('Transação removida'),
      onError: () => toast.error('Erro ao remover'),
    });
  };

  return (
    <div className="space-y-4 max-w-sm mx-auto w-full">
      <div className="bg-card rounded-2xl p-2 shadow-card flex justify-center overflow-hidden">
        <Calendar
          mode="single"
          month={startOfMonth(selectedDate)}
          onMonthChange={handleMonthChange}
          selected={selectedDate}
          onSelect={(date) => {
            if (date) onDateChange(date);
          }}
          locale={ptBR}
          className="w-full max-w-full flex justify-center"
          modifiers={modifiers}
          modifiersClassNames={{
            hasIncome: "day-has-income",
            hasExpense: "day-has-expense",
            hasBoth: "day-has-both",
          }}
          disabled={(date) => date > new Date()}
        />
      </div>
      
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
          {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
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