import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, TransactionInsert } from '@/types/finance';
import { useAuth } from './useAuth';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface UseTransactionsOptions {
  selectedDate?: Date;
  filterCategories?: string[]; 
}

export function useTransactions({ selectedDate, filterCategories }: UseTransactionsOptions = {}) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  const currentDate = selectedDate || new Date();
  const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  // Criamos uma lista de IDs: o meu + o vinculado (se existir)
  const userIds = [user?.id].filter(Boolean) as string[];
  if (profile?.linked_user_id) {
    if (!userIds.includes(profile.linked_user_id)) {
      userIds.push(profile.linked_user_id);
    }
  }

  const queryKey = ['transactions', userIds.join(','), monthStart, monthEnd];

  const transactionsQuery = useQuery({
    queryKey: queryKey,
    queryFn: async (): Promise<Transaction[]> => {
      if (userIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .in('user_id', userIds)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });

  const addTransaction = useMutation({
    mutationFn: async (transaction: TransactionInsert) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          ...transaction,
          user_id: user.id,
        });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const allTransactions = transactionsQuery.data || [];
  
  const totalIncome = allTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const filteredExpenses = allTransactions
    .filter(t => t.type === 'expense')
    .filter(t => !filterCategories || filterCategories.length === 0 || filterCategories.includes(t.category));

  const totalExpenses = filteredExpenses
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const balance = totalIncome - totalExpenses;

  const expensesByCategory = filteredExpenses
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  return {
    transactions: allTransactions,
    allTransactions,
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    addTransaction,
    deleteTransaction,
    totalIncome,
    totalExpenses,
    balance,
    expensesByCategory,
  };
}