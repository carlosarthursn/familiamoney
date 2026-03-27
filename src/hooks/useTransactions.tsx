"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, TransactionInsert } from '@/types/finance';
import { useAuth } from './useAuth';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';

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
  
  // Usamos strings de data puras para evitar problemas de fuso horário
  const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-01');
  const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  // IDs para busca (garantindo que o ID do usuário logado seja prioridade)
  const currentUserId = user?.id;
  const linkedId = profile?.linked_user_id;
  
  const userIds = [currentUserId, linkedId].filter(Boolean) as string[];

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
        console.error('Erro ao buscar transações:', tError);
        throw tError;
      }

      // Buscar nomes dos perfis para identificar quem postou
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
        // Forçar conversão para número caso venha como string do banco
        amount: Number(t.amount),
        author_name: t.user_id === currentUserId ? 'Você' : (profileMap[t.user_id] || 'Parceiro')
      }));
    },
    enabled: !!currentUserId,
    refetchOnWindowFocus: true, // Garante atualização ao voltar para a aba
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
  
  // Cálculos de saldo total (sempre baseados em todas as transações do mês)
  const totalIncome = allTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpensesAll = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Cálculos filtrados (usados na tela de Análise)
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