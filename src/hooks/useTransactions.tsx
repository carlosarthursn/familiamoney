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

  const transactionsQuery = useQuery({
    queryKey: ['transactions', userId, monthStart, monthEnd],
    queryFn: async () => {
      if (!userId) return [];
      
      // Busca direta. O RLS do Supabase garante que você só veja o que tem permissão.
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
    staleTime: 0,
    gcTime: 0, // Não mantém lixo em cache para garantir atualização real
  });

  const addTransaction = useMutation({
    mutationFn: async (transaction: TransactionInsert) => {
      if (!userId) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          ...transaction,
          user_id: userId,
        });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      // Invalida o cache IMEDIATAMENTE após adicionar
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dateRangeTransactions'] });
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
    addTransaction,
    deleteTransaction,
    totalIncome,
    totalExpenses,
    totalExpensesAll,
    personalExpenses,
    balance,
    expensesByCategory,
  };
}