import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Info } from 'lucide-react';
import { differenceInDays, endOfMonth, startOfDay } from 'date-fns';

interface DailyBudgetCardProps {
  balance: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function DailyBudgetCard({ balance }: DailyBudgetCardProps) {
  const dailyAmount = useMemo(() => {
    const today = startOfDay(new Date());
    const lastDayOfMonth = endOfMonth(today);
    const daysRemaining = differenceInDays(lastDayOfMonth, today) + 1;
    
    // Se o saldo for negativo, o limite diário é zero
    if (balance <= 0) return 0;
    
    return balance / daysRemaining;
  }, [balance]);

  return (
    <Card className="border-none shadow-sm bg-muted/30">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center border border-border">
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Disponível p/ hoje</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(dailyAmount)}</p>
          </div>
        </div>
        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-background border border-border opacity-50">
          <Info className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}