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
  
  // Garante que temos uma data válida
  const currentDate = selectedDate || new Date();
  
  // Usamos strings de data YYYY-MM-DD para evitar problemas de fuso horário na busca do Supabase
  const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  // IDs para busca (próprio + parceiro)
  const userIds = [user?.id, profile?.linked_user_id].filter(Boolean) as string[];

  // Chave da query estável baseada nos IDs dos usuários e no intervalo de datas
  const queryKey = ['transactions', userIds.sort().join(','), monthStart, monthEnd];

  const transactionsQuery = useQuery({
    queryKey: queryKey,
    queryFn: async (): Promise<TransactionWithAuthor[]> => {
      if (userIds.length === 0) return [];
      
      try {
        const { data: transactions, error: tError } = await supabase
          .from('transactions')
          .select('*')
          .in('user_id', userIds)
          .gte('date', monthStart)
          .lte('date', monthEnd)
          .order('date', { ascending: false });

        if (tError) throw tError;

        // Buscar nomes dos perfis para identificar o autor da transação
        const { data: profiles, error: pError } = await supabase
          .from('profiles')
          .select('user_id, name, email')
          .in('user_id', userIds);

        if (pError) console.warn('Erro ao buscar perfis:', pError);

        const profileMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = p.name || p.email?.split('@')[0] || 'Usuário';
          return acc;
        }, {} as Record<string, string>);

        return (transactions || []).map(t => ({
          ...t,
          amount: Number(t.amount),
          author_name: t.user_id === user?.id ? 'Você' : (profileMap[t.user_id] || 'Parceiro')
        }));
      } catch (error) {
        console.error('Falha na busca de transações:', error);
        return []; // Retorna lista vazia em caso de erro para não travar o carregamento
      }
    },
    enabled: !!user?.id,
    retry: 1,
    staleTime: 1000 * 60, // 1 minuto de cache
  });

  const addTransaction = useMutation({
    mutationFn: async (transaction: TransactionInsert) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
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
  
  // Cálculos baseados em todas as transações do mês
  const totalIncome = allTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpensesAll = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Cálculos filtrados por categoria (para visão de análise)
  const filteredExpenses = allTransactions
    .filter(t => t.type === 'expense')
    .filter(t => !filterCategories || filterCategories.length === 0 || filterCategories.includes(t.category));

  const totalExpenses = filteredExpenses
    .reduce((sum, t) => sum + t.amount, 0);

  const personalExpenses = allTransactions
    .filter(t => t.type === 'expense' && t.user_id === user?.id)
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