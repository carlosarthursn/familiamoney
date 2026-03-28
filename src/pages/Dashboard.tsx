"use client";

import { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { BalanceCard } from '@/components/BalanceCard';
import { TransactionList } from '@/components/TransactionList';
import { MonthSelector } from '@/components/MonthSelector';
import { FinancialTips } from '@/components/FinancialTips';
import { DailyBudgetCard } from '@/components/DailyBudgetCard';
import { toast } from 'sonner';
import { SuccessOverlay } from '@/components/SuccessOverlay';

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { 
    transactions: allTransactions, 
    isLoading, 
    totalIncome, 
    totalExpensesAll, 
    balance, 
    deleteTransaction 
  } = useTransactions({ selectedDate });
  
  const handleDelete = (id: string) => {
    deleteTransaction.mutate(id, {
      onSuccess: () => {
        setSuccessMessage('Transação removida!');
        setShowSuccess(true);
      },
      onError: () => toast.error('Erro ao remover'),
    });
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {showSuccess && (
        <SuccessOverlay 
          message={successMessage} 
          onFinished={() => setShowSuccess(false)} 
        />
      )}
      
      <MonthSelector currentDate={selectedDate} onDateChange={setSelectedDate} />
      
      <BalanceCard 
        balance={balance} 
        income={totalIncome} 
        expenses={totalExpensesAll} 
        showBalance={true}
      />
      
      <DailyBudgetCard />
      
      <FinancialTips />
      
      <div>
        <h2 className="text-lg font-semibold mb-3">Últimas transações</h2>
        <TransactionList 
          transactions={allTransactions.slice(0, 5)} 
          isLoading={isLoading} 
          onDelete={handleDelete} 
        />
      </div>
    </div>
  );
}