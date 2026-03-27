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
  
  // Define o intervalo do mês usando o formato ISO padrão do banco
  const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-01');
  const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  const currentUserId = user?.id;

  const queryKey = ['transactions', currentUserId, monthStart, monthEnd];

  const transactionsQuery = useQuery({
    queryKey: queryKey,
    queryFn: async (): Promise<TransactionWithAuthor[]> => {
      if (!currentUserId) return [];
      
      // Buscamos as transações sem filtros complexos de ID no JS, 
      // deixando o RLS do banco fazer o trabalho de segurança.
      const { data: transactions, error: tError } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false });

      if (tError) {
        console.error('Erro ao buscar transações:', tError);
        throw tError;
      }

      // Buscar perfis para identificar quem fez a transação (Você ou Parceiro)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email');

      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p.name || p.email?.split('@')[0] || 'Usuário';
        return acc;
      }, {} as Record<string, string>);

      return (transactions || []).map(t => ({
        ...t,
        amount: Number(t.amount),
        author_name: t.user_id === currentUserId ? 'Você' : (profileMap[t.user_id] || 'Parceiro')
      }));
    },
    enabled: !!currentUserId,
    staleTime: 0, // Garante que os dados não fiquem "velhos" no cache
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
      // Invalida todas as queries relacionadas a transações para forçar o refresh
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