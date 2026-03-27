import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/finance';
import { useAuth } from './useAuth';
import { format } from 'date-fns';

interface DateRange {
  from: Date;
  to: Date;
}

export function useDateRangeTransactions(range: DateRange | null) {
  const { user, profile } = useAuth();
  
  const userIds = [user?.id].filter(Boolean) as string[];
  if (profile?.linked_user_id) userIds.push(profile.linked_user_id);

  const formattedFrom = range ? format(range.from, 'yyyy-MM-dd') : null;
  const formattedTo = range ? format(range.to, 'yyyy-MM-dd') : null;

  const queryKey = ['dateRangeTransactions', userIds.sort().join(','), formattedFrom, formattedTo];

  const transactionsQuery = useQuery({
    queryKey: queryKey,
    queryFn: async (): Promise<Transaction[]> => {
      if (userIds.length === 0 || !range) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .in('user_id', userIds)
        .gte('date', formattedFrom)
        .lte('date', formattedTo)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user && !!range,
  });

  const transactions = transactionsQuery.data || [];
  
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const balance = totalIncome - totalExpenses;

  return {
    transactions,
    isLoading: transactionsQuery.isLoading,
    totalIncome,
    totalExpenses,
    balance,
  };
}