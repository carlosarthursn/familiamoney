import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';

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
  type: 'income' | 'expense';
  created_at: string;
}

export function useRecurring() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  const userIds = [user?.id].filter(Boolean) as string[];
  if (profile?.linked_user_id) userIds.push(profile.linked_user_id);

  const cacheKey = `confere_rec_${userIds.sort().join(',')}`;

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
      
      const formatted = (data || []).map(item => ({
        ...item,
        type: item.type || 'expense'
      })) as RecurringExpense[];

      try {
        localStorage.setItem(cacheKey, JSON.stringify(formatted));
      } catch (e) {}

      return formatted;
    },
    initialData: () => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (e) {}
      return undefined;
    },
    enabled: !!user,
    staleTime: 0,
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

  const updateRecurring = useMutation({
    mutationFn: async (expense: Partial<RecurringExpense> & { id: string }) => {
      const { id, ...updates } = expense;
      const { error } = await supabase.from('recurring_expenses').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
      toast.success('Atualizado com sucesso!');
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

  const markAsPaid = useMutation({
    mutationFn: async (item: RecurringExpense) => {
      if (!user) throw new Error('Não autenticado');
      
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        amount: item.amount,
        category: item.category,
        type: item.type,
        date: format(new Date(), 'yyyy-MM-dd'),
        description: `${item.name} (${item.type === 'income' ? 'Recebido' : 'Pago'})`
      });

      if (error) throw error;

      if (item.is_installment && item.current_installment !== null && item.total_installments !== null) {
        if (item.current_installment < item.total_installments) {
          await supabase.from('recurring_expenses')
            .update({ current_installment: item.current_installment + 1 })
            .eq('id', item.id);
        } else {
          await supabase.from('recurring_expenses')
            .update({ is_active: false })
            .eq('id', item.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
      toast.success('Lançamento realizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao realizar lançamento: ' + error.message);
    }
  });

  const unmarkAsPaid = useMutation({
    mutationFn: async (item: RecurringExpense) => {
      if (!user) throw new Error('Não autenticado');
      
      const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      const desc = `${item.name} (${item.type === 'income' ? 'Recebido' : 'Pago'})`;

      const { data: trans } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('description', desc)
        .gte('date', start)
        .lte('date', end)
        .limit(1);

      if (trans && trans.length > 0) {
        const { error } = await supabase.from('transactions').delete().eq('id', trans[0].id);
        if (error) throw error;

        // Reverte parcela se necessário
        if (item.is_installment && item.current_installment !== null) {
          const updates: any = {};
          if (!item.is_active) updates.is_active = true;
          if (item.current_installment > 1) updates.current_installment = item.current_installment - 1;
          
          if (Object.keys(updates).length > 0) {
            await supabase.from('recurring_expenses').update(updates).eq('id', item.id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
      toast.success('Lançamento removido.');
    }
  });

  return {
    recurring: recurringQuery.data || [],
    isLoading: recurringQuery.isLoading,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    markAsPaid,
    unmarkAsPaid,
  };
}