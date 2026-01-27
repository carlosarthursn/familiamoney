import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  balance: number;
  income: number;
  expenses: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function BalanceCard({ balance, income, expenses }: BalanceCardProps) {
  return (
    <div className="space-y-4">
      {/* Main Balance Card */}
      <div className="gradient-primary rounded-2xl p-6 text-primary-foreground shadow-card">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-5 w-5 opacity-80" />
          <span className="text-sm font-medium opacity-80">Saldo Atual</span>
        </div>
        <p className={cn(
          "text-3xl font-bold tracking-tight",
          balance < 0 && "text-red-200"
        )}>
          {formatCurrency(balance)}
        </p>
      </div>

      {/* Income/Expense Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-full gradient-income flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-success-foreground" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium">Receitas</p>
          <p className="text-lg font-bold text-success">
            {formatCurrency(income)}
          </p>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-full gradient-expense flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-destructive-foreground" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium">Despesas</p>
          <p className="text-lg font-bold text-destructive">
            {formatCurrency(expenses)}
          </p>
        </div>
      </div>
    </div>
  );
}
