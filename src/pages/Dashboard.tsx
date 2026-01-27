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
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const { user, signOut } = useAuth();
  const { 
    transactions, 
    isLoading, 
    totalIncome, 
    totalExpenses, 
    balance,
    deleteTransaction 
  } = useTransactions(selectedDate);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Até logo!');
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
          <div className="space-y-6 animate-fade-in">
            <MonthSelector 
              currentDate={selectedDate} 
              onDateChange={setSelectedDate} 
            />
            <BalanceCard 
              balance={balance} 
              income={totalIncome} 
              expenses={totalExpenses} 
            />
            
            <div>
              <h2 className="text-lg font-semibold mb-3">Últimas transações</h2>
              <TransactionList 
                transactions={transactions.slice(0, 5)} 
                isLoading={isLoading}
                onDelete={handleDelete}
              />
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-4 animate-fade-in">
            <MonthSelector 
              currentDate={selectedDate} 
              onDateChange={setSelectedDate} 
            />
            <TransactionList 
              transactions={transactions} 
              isLoading={isLoading}
              onDelete={handleDelete}
            />
          </div>
        );
        
      case 'calendar':
        return (
          <div className="space-y-4 animate-fade-in">
            <CalendarView 
              selectedDate={selectedDate} 
              onDateChange={setSelectedDate} 
            />
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-6 animate-fade-in">
            <MonthSelector 
              currentDate={selectedDate} 
              onDateChange={setSelectedDate} 
            />
            <AnalysisView 
              selectedDate={selectedDate} 
            />
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-card rounded-xl p-6 shadow-card text-center">
              <div className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="font-medium text-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Membro desde {format(new Date(user?.created_at || Date.now()), "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full h-12 rounded-xl touch-target"
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

  if (isLoading && activeTab === 'home') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 safe-top">
      <header className="px-6 pt-6 pb-4">
        <p className="text-muted-foreground text-sm">Olá,</p>
        <h1 className="text-xl font-bold text-foreground">
          {user?.email?.split('@')[0] || 'Usuário'}
        </h1>
      </header>

      <main className="px-6">
        {renderContent()}
      </main>

      <AddTransactionSheet />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}