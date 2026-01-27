import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { DateRangeSelector } from './DateRangeSelector';
import { useDateRangeTransactions } from '@/hooks/useDateRangeTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function ReportsView() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const { 
    isLoading, 
    totalIncome, 
    totalExpenses, 
    balance 
  } = useDateRangeTransactions(dateRange ? { from: dateRange.from!, to: dateRange.to || dateRange.from! } : null);

  const isRangeSelected = dateRange?.from && dateRange?.to;

  const renderSummaryCard = (title: string, value: number, icon: React.ElementType, colorClass: string) => (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {React.createElement(icon, { className: cn("h-4 w-4", colorClass) })}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(value)}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold">Relatórios por Período</h2>

      <DateRangeSelector date={dateRange} setDate={setDateRange} />

      {!isRangeSelected && (
        <div className="text-center py-12 text-muted-foreground">
          <Scale className="h-10 w-10 mx-auto mb-3" />
          <p>Selecione um intervalo de datas para gerar o relatório.</p>
        </div>
      )}

      {isRangeSelected && isLoading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {isRangeSelected && !isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {renderSummaryCard("Receitas Totais", totalIncome, TrendingUp, "text-success")}
            {renderSummaryCard("Despesas Totais", totalExpenses, TrendingDown, "text-destructive")}
          </div>
          
          <Card className={cn(
            "shadow-card",
            balance >= 0 ? "border-success/50" : "border-destructive/50"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fluxo Líquido</CardTitle>
              <Scale className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-3xl font-bold",
                balance >= 0 ? "text-success" : "text-destructive"
              )}>
                {formatCurrency(balance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Período: {format(dateRange.from!, 'dd/MM/yy', { locale: ptBR })} - {format(dateRange.to!, 'dd/MM/yy', { locale: ptBR })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}