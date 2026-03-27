"use client";

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const currentDate = selectedDate || new Date();
  const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-01');
  const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  const userId = user?.id;

  // Query principal para buscar transações
  const transactionsQuery = useQuery({
    queryKey: ['transactions', userId, monthStart, monthEnd],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false });

      if (error) {
        console.error('Erro ao buscar transações:', error);
        throw error;
      }

      return (data || []).map(t => ({
        ...t,
        amount: Number(t.amount),
        author_name: t.user_id === userId ? 'Você' : 'Parceiro'
      }));
    },
    enabled: !!userId,
    // Forçamos a atualização ao focar na janela e removemos o tempo de cache estático
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const addTransaction = useMutation({
    mutationFn: async (transaction: TransactionInsert) => {
      if (!userId) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          amount: transaction.amount,
          category: transaction.category,
          date: transaction.date,
          description: transaction.description || null,
          type: transaction.type,
          user_id: userId,
        });

      if (error) throw error;
      return true;
    },
    onSuccess: async () => {
      // Invalida e força o refetch imediato de todas as listas de transações
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.refetchQueries({ queryKey: ['transactions'] });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const transactions = transactionsQuery.data || [];
  
  // Cálculos baseados nos dados atuais
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpensesAll = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredExpenses = transactions
    .filter(t => t.type === 'expense')
    .filter(t => !filterCategories || filterCategories.length === 0 || filterCategories.includes(t.category));

  const totalExpenses = filteredExpenses.reduce((sum, t) => sum + t.amount, 0);
  
  const personalExpenses = transactions
    .filter(t => t.type === 'expense' && t.user_id === userId)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpensesAll;

  const expensesByCategory = filteredExpenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return {
    transactions,
    isLoading: transactionsQuery.isLoading,
    isRefetching: transactionsQuery.isRefetching,
    addTransaction,
    deleteTransaction,
    totalIncome,
    totalExpenses,
    totalExpensesAll,
    personalExpenses,
    balance,
    expensesByCategory,
    refetch: transactionsQuery.refetch
  };
}