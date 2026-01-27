import { Transaction } from '@/types/finance';
import { TransactionItem } from './TransactionItem';
import { Wallet } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

export function TransactionList({ transactions, isLoading, onDelete }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-xl animate-pulse-soft" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">
          Nenhuma transação ainda
        </p>
        <p className="text-sm text-muted-foreground">
          Adicione sua primeira movimentação
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <TransactionItem 
          key={transaction.id} 
          transaction={transaction}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
