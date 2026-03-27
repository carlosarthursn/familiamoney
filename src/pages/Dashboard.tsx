"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { BalanceCard } from '@/components/BalanceCard';
import { TransactionList } from '@/components/TransactionList';
import { AddTransactionSheet } from '@/components/AddTransactionSheet';
import { BottomNav } from '@/components/BottomNav';
import { MonthSelector } from '@/components/MonthSelector';
import { AnalysisView } from '@/components/AnalysisView';
import { CalendarView } from '@/components/CalendarView';
import { ProfileSettings } from '@/components/ProfileSettings';
import { PlanningView } from '@/components/PlanningView';
import { Header } from '@/components/Header';
import { FinancialTips } from '@/components/FinancialTips';
import { DailyBudgetCard } from '@/components/DailyBudgetCard';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showBalance, setShowBalance] = useState(true);
  const { user, profile, signOut } = useAuth();
  
  // Usamos totalExpensesAll aqui para garantir que o saldo reflita todas as saídas
  const { 
    transactions: allTransactions, 
    isLoading, 
    totalIncome, 
    totalExpensesAll, 
    balance, 
    deleteTransaction 
  } = useTransactions({ selectedDate });
  
  const displayName = profile?.name || 'Usuário';

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Até logo!');
    } catch (error) {
      toast.error('Erro ao sair da conta.');
    }
  };
  
  const handleDelete = (id: string) => {
    deleteTransaction.mutate(id, {
      onSuccess: () => toast.success('Transação removida'),
      onError: () => toast.error('Erro ao remover'),
    });
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6 animate-fade-in mt-6">
            <MonthSelector currentDate={selectedDate} onDateChange={setSelectedDate} />
            <BalanceCard 
              balance={balance} 
              income={totalIncome} 
              expenses={totalExpensesAll} 
              showBalance={showBalance}
            />
            
            <DailyBudgetCard />
            
            <FinancialTips />

            <div>
              <h2 className="text-lg font-semibold mb-3">Últimas transações</h2>
              <TransactionList transactions={allTransactions.slice(0, 5)} isLoading={isLoading} onDelete={handleDelete} />
            </div>
          </div>
        );
      case 'calendar':
        return (
          <div className="space-y-4 animate-fade-in mt-6">
            <CalendarView selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </div>
        );
      case 'analysis':
        return (
          <div className="space-y-6 animate-fade-in mt-6">
            <MonthSelector currentDate={selectedDate} onDateChange={setSelectedDate} />
            <AnalysisView selectedDate={selectedDate} />
            <div className="bg-card rounded-xl p-4 shadow-card">
              <h3 className="text-sm font-semibold mb-3">Transações do Mês</h3>
              <TransactionList transactions={allTransactions} isLoading={isLoading} onDelete={handleDelete} />
            </div>
          </div>
        );
      case 'planning':
        return (
          <div className="mt-6">
            <PlanningView />
          </div>
        );
      case 'profile':
        return (
          <div className="space-y-6 animate-fade-in pb-10 mt-6">
            <div className="bg-card rounded-xl p-6 shadow-card text-center">
              <div className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="font-bold text-lg text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <p className="text-[10px] text-muted-foreground mt-2 italic">
                Membro desde {format(new Date(user?.created_at || Date.now()), "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            
            <ProfileSettings />
            
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="w-full h-12 rounded-xl touch-target border-destructive/20 text-destructive hover:bg-destructive/5 mt-4"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair da conta
            </Button>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        displayName={displayName} 
        showBalance={showBalance}
        setShowBalance={setShowBalance}
        onProfileClick={() => setActiveTab('profile')} 
        onAnalysisClick={() => setActiveTab('analysis')}
      />
      <main className="px-6 pb-24">
        {renderContent()}
      </main>
      <AddTransactionSheet />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}