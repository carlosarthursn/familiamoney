import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface RecurringExpense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string;
  due_day: number;
  is_installment: boolean;
  total_installments: number | null;
  current_installment: number | null;
  is_active: boolean;
  type: 'income' | 'expense'; // Novo campo
  created_at: string;
}

export function useRecurring() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  const userIds = [user?.id].filter(Boolean) as string[];
  if (profile?.linked_user_id) userIds.push(profile.linked_user_id);

  const recurringQuery = useQuery({
    queryKey: ['recurringExpenses', userIds.sort().join(',')],
    queryFn: async (): Promise<RecurringExpense[]> => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .in('user_id', userIds)
        .order('due_day', { ascending: true });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        type: item.type || 'expense' // Fallback para gastos antigos
      })) as RecurringExpense[];
    },
    enabled: !!user,
  });

  const addRecurring = useMutation({
    mutationFn: async (expense: Omit<RecurringExpense, 'id' | 'user_id' | 'created_at' | 'is_active'>) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('recurring_expenses').insert({
        ...expense,
        user_id: user.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
      toast.success('Configurado com sucesso!');
    },
  });

  const deleteRecurring = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
      toast.success('Removido com sucesso!');
    },
  });

  return {
    recurring: recurringQuery.data || [],
    isLoading: recurringQuery.isLoading,
    addRecurring,
    deleteRecurring,
  };
}