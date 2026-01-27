import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, TransactionInsert } from '@/types/finance';
import { useAuth } from './useAuth';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface UseTransactionsOptions {
  selectedDate?: Date;
  // Este filtro é usado principalmente para análise de despesas
  filterCategories?: string[]; 
}

export function useTransactions({ selectedDate, filterCategories }: UseTransactionsOptions = {}) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  const currentDate = selectedDate || new Date();
  const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  // Determinar quais user_ids buscar
  const userIds = [user?.id].filter((id): id is string => !!id);
  // Se o perfil tiver um linked_user_id, adicionamos ele à lista
  if (profile?.linked_user_id && !userIds.includes(profile.linked_user_id)) {
    userIds.push(profile.linked_user_id);
  }

  const queryKey = ['transactions', userIds, monthStart, monthEnd];

  const transactionsQuery = useQuery({
    queryKey: queryKey,
    queryFn: async (): Promise<Transaction[]> => {
      if (userIds.length === 0) return [];
      
      // Buscamos TODAS as transações do mês para os IDs relevantes
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .in('user_id', userIds) // Filtra por múltiplos user_ids
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: userIds.length > 0,
  });

  const addTransaction = useMutation({
    mutationFn: async (transaction: TransactionInsert) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...transaction,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
  
  // 1. Calcular Receitas Totais (sempre todas as receitas do mês)
  const totalIncome = allTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  // 2. Filtrar Despesas: Aplicar o filtro de categoria APENAS nas despesas
  const filteredExpenses = allTransactions
    .filter(t => t.type === 'expense')
    .filter(t => !filterCategories || filterCategories.length === 0 || filterCategories.includes(t.category));

  // 3. Calcular Despesas Totais (apenas as despesas filtradas)
  const totalExpenses = filteredExpenses
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  // 4. Calcular Saldo/Fluxo Líquido (Receitas Totais - Despesas Filtradas)
  const balance = totalIncome - totalExpenses;

  // 5. Calcular Despesas por Categoria (baseado nas despesas filtradas)
  const expensesByCategory = filteredExpenses
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  // 6. Transações para exibição (Todas as transações do mês, ordenadas)
  // Nota: Para a aba Analysis, o AnalysisView usa o totalIncome e totalExpenses calculados acima.
  // Para Home/History/Calendar, queremos todas as transações do mês.
  const transactionsForDisplay = allTransactions;


  return {
    transactions: transactionsForDisplay,
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