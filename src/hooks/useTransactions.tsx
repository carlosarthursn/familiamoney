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

interface TransactionWithAuthor extends Transaction {
  author_name?: string;
}

export function useTransactions({ selectedDate, filterCategories }: UseTransactionsOptions = {}) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  const currentDate = selectedDate || new Date();
  
  // Usamos o formato YYYY-MM-DD para garantir compatibilidade com o tipo 'date' do PostgreSQL
  const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-01');
  const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  // IDs para busca (próprio + parceiro)
  const currentUserId = user?.id;
  const partnerId = profile?.linked_user_id;
  const userIds = [currentUserId, partnerId].filter(Boolean) as string[];

  // Chave da query estável
  const queryKey = ['transactions', userIds.sort().join(','), monthStart, monthEnd];

  const transactionsQuery = useQuery({
    queryKey: queryKey,
    queryFn: async (): Promise<TransactionWithAuthor[]> => {
      if (!currentUserId) return [];
      
      const { data: transactions, error: tError } = await supabase
        .from('transactions')
        .select('*')
        .in('user_id', userIds)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false });

      if (tError) {
        console.error('Erro na query de transações:', tError);
        throw tError;
      }

      // Buscar nomes dos autores para exibir na lista
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);

      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p.name || p.email?.split('@')[0] || 'Usuário';
        return acc;
      }, {} as Record<string, string>);

      return (transactions || []).map(t => ({
        ...t,
        amount: Number(t.amount), // Garante que é número para o cálculo do saldo
        author_name: t.user_id === currentUserId ? 'Você' : (profileMap[t.user_id] || 'Parceiro')
      }));
    },
    enabled: !!currentUserId,
    staleTime: 0, // Garante que sempre busque dados frescos
  });

  const addTransaction = useMutation({
    mutationFn: async (transaction: TransactionInsert) => {
      if (!currentUserId) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          ...transaction,
          user_id: currentUserId,
        });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dateRangeTransactions'] });
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
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpensesAll = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredExpenses = allTransactions
    .filter(t => t.type === 'expense')
    .filter(t => !filterCategories || filterCategories.length === 0 || filterCategories.includes(t.category));

  const totalExpenses = filteredExpenses
    .reduce((sum, t) => sum + t.amount, 0);

  const personalExpenses = allTransactions
    .filter(t => t.type === 'expense' && t.user_id === currentUserId)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpensesAll;

  const expensesByCategory = filteredExpenses
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  return {
    transactions: allTransactions,
    isLoading: transactionsQuery.isLoading,
    isError: transactionsQuery.isError,
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