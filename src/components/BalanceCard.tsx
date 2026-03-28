import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  balance: number;
  income: number;
  expenses: number;
  showBalance?: boolean;
}

function formatCurrency(value: number, show: boolean): string {
  if (!show) return 'R$ •••••';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function BalanceCard({ balance, income, expenses, showBalance = true }: BalanceCardProps) {
  // Ajuste dinâmico de fonte para o saldo principal
  const balanceFontSize = balance.toString().length > 12 ? "text-xl" : balance.toString().length > 9 ? "text-2xl" : "text-3xl";

  return (
    <div className="space-y-4">
      {/* Main Balance Card */}
      <div className="gradient-primary rounded-2xl p-6 text-white shadow-card relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-5 w-5 text-white/80" />
            <span className="text-sm font-medium text-white/80">Saldo Atual</span>
          </div>
          <p className={cn("font-bold tracking-tight text-white transition-all", balanceFontSize)}>
            {formatCurrency(balance, showBalance)}
          </p>
        </div>
        <div className="absolute -right-4 -top-4 h-24 w-24 bg-white/10 rounded-full blur-2xl" />
      </div>
      
      {/* Income/Expense Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 shadow-card border border-border/50 overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-full gradient-income flex items-center justify-center shadow-sm">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Receitas</p>
          <p className="text-base font-bold text-success truncate">
            {formatCurrency(income, showBalance)}
          </p>
        </div>
        
        <div className="bg-card rounded-xl p-4 shadow-card border border-border/50 overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-full gradient-expense flex items-center justify-center shadow-sm">
              <TrendingDown className="h-4 w-4 text-white" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Despesas</p>
          <p className="text-base font-bold text-destructive truncate">
            {formatCurrency(expenses, showBalance)}
          </p>
        </div>
      </div>
    </div>
  );
}