import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthSelectorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function MonthSelector({ currentDate, onDateChange }: MonthSelectorProps) {
  const handlePrevMonth = () => {
    onDateChange(subMonths(currentDate, 1));
  };
  
  const handleNextMonth = () => {
    onDateChange(addMonths(currentDate, 1));
  };
  
  const isCurrentMonth = format(currentDate, 'yyyy-MM') === format(new Date(), 'yyyy-MM');
  
  return (
    <div className="flex items-center justify-between">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handlePrevMonth}
        className="h-10 w-10 rounded-full touch-target"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <h2 className="text-lg font-semibold capitalize">
        {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
      </h2>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleNextMonth}
        disabled={isCurrentMonth}
        className="h-10 w-10 rounded-full touch-target"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}