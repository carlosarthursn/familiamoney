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
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  const currentDate = selectedDate || new Date();
  const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-01');
  const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  // Lista de IDs para buscar (meu + parceiro)
  const userIds = [user?.id].filter(Boolean) as string[];
  if (profile?.linked_user_id) {
    userIds.push(profile.linked_user_id);
  }

  // Chave de cache única para este mês e usuário
  const cacheKey = `confere_txs_${userIds.sort().join(',')}_${monthStart}`;

  const transactionsQuery = useQuery({
    queryKey: ['transactions', userIds.sort().join(','), monthStart, monthEnd],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .in('user_id', userIds)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false });

      if (error) {
        console.error('Erro ao buscar transações:', error);
        throw error;
      }

      const formattedData = (data || []).map(t => ({
        ...t,
        amount: Number(t.amount),
        author_name: t.user_id === user?.id ? 'Você' : (profile?.partnerName || 'Parceiro')
      }));

      // TRUQUE 3: Salva transações no cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify(formattedData));
      } catch (e) {}

      return formattedData;
    },
    // TRUQUE 4: Carrega instantaneamente os dados antigos antes do servidor responder
    initialData: () => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (e) {}
      return undefined;
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const addTransaction = useMutation({
    mutationFn: async (transaction: TransactionInsert) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          amount: transaction.amount,
          category: transaction.category,
          date: transaction.date,
          description: transaction.description || null,
          type: transaction.type,
          user_id: user.id,
        });

      if (error) throw error;
      return true;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
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
    .filter(t => t.type === 'expense' && t.user_id === user?.id)
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