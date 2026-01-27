import { useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTransactions } from '@/hooks/useTransactions';
import { Loader2 } from 'lucide-react';

interface CalendarViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function CalendarView({ selectedDate, onDateChange }: CalendarViewProps) {
  // useTransactions fetches data based on the month of selectedDate
  const { transactions, isLoading } = useTransactions(selectedDate);

  // Calculate days with transactions for highlighting
  const daysWithTransactions = useMemo(() => {
    if (isLoading || !transactions) return [];
    
    const dates = new Set<string>();
    transactions.forEach(t => {
      dates.add(t.date); 
    });
    // Convert 'yyyy-MM-dd' strings to Date objects for react-day-picker modifiers
    return Array.from(dates).map(d => new Date(d + 'T00:00:00')); 
  }, [transactions, isLoading]);

  const modifiers = {
    highlighted: daysWithTransactions,
  };

  const modifiersClassNames = {
    highlighted: "bg-primary text-primary-foreground rounded-full font-bold",
  };

  // Handler for when the user navigates months in the calendar UI
  const handleMonthChange = (newMonth: Date) => {
    // Update the selectedDate to the first day of the new month
    onDateChange(startOfMonth(newMonth));
  };

  // Filter transactions for the currently selected day
  const transactionsForSelectedDay = transactions.filter(t => 
    isSameDay(new Date(t.date + 'T00:00:00'), selectedDate)
  );

  return (
    <div className="bg-card rounded-xl p-4 shadow-card">
      <Calendar
        mode="single"
        month={startOfMonth(selectedDate)} // Control the displayed month based on selectedDate
        onMonthChange={handleMonthChange}
        selected={selectedDate}
        onSelect={(date) => {
          if (date) {
            onDateChange(date);
          }
        }}
        locale={ptBR}
        className="w-full p-0"
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        disabled={(date) => date > new Date()} // Disable future dates
      />
      
      <div className="mt-4 pt-4 border-t">
        <h3 className="font-semibold mb-2">
          Transações em {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
        </h3>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : transactionsForSelectedDay.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {transactionsForSelectedDay.length} transação(ões) encontrada(s).
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma transação neste dia.</p>
        )}
      </div>
    </div>
  );
}