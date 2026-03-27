import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SavingsGoal, WishlistItem } from '@/types/finance';
import { useAuth } from './useAuth';

interface SavingsGoalRow {
  id: string;
  user_id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  created_at: string;
}

interface WishlistItemRow {
  id: string;
  user_id: string;
  name: string;
  price: number;
  priority: string;
  link: string | null;
  created_at: string;
}

export function usePlanning() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  const userIds = [user?.id].filter(Boolean) as string[];
  if (profile?.linked_user_id) userIds.push(profile.linked_user_id);

  // --- Savings Goals ---
  const goalsQuery = useQuery({
    queryKey: ['savingsGoals', userIds.sort().join(',')],
    queryFn: async (): Promise<SavingsGoal[]> => {
      if (userIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('savings_goals' as any)
        .select('*')
        .in('user_id', userIds)
        .order('targetDate', { ascending: true });

      if (error) throw error;
      const rows = data as unknown as SavingsGoalRow[];
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        targetAmount: row.targetAmount,
        currentAmount: row.currentAmount,
        targetDate: row.targetDate,
      }));
    },
    enabled: !!user,
  });

  const addGoal = useMutation({
    mutationFn: async (goal: Omit<SavingsGoal, 'id'>) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase.from('savings_goals' as any).insert({ 
        user_id: user.id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: goal.targetDate,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savingsGoals'] }),
  });

  const updateGoalAmount = useMutation({
    mutationFn: async ({ id, amountChange }: { id: string, amountChange: number }) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { data: goal } = await supabase.from('savings_goals' as any).select('currentAmount').eq('id', id).single();
      if (!goal) throw new Error('Meta não encontrada');
      const { error } = await supabase.from('savings_goals' as any).update({ 
        currentAmount: (goal as any).currentAmount + amountChange 
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savingsGoals'] }),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('savings_goals' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savingsGoals'] }),
  });
  
  // --- Wish List ---
  const wishListQuery = useQuery({
    queryKey: ['wishList', userIds.sort().join(',')],
    queryFn: async (): Promise<WishlistItem[]> => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase
        .from('wishlist_items' as any)
        .select('*')
        .in('user_id', userIds)
        .order('priority', { ascending: false });

      if (error) throw error;
      const rows = data as unknown as WishlistItemRow[];
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        price: row.price,
        priority: row.priority as 'high' | 'medium' | 'low',
        link: row.link || undefined,
      }));
    },
    enabled: !!user,
  });

  const addItem = useMutation({
    mutationFn: async (item: Omit<WishlistItem, 'id'>) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase.from('wishlist_items' as any).insert({ 
        user_id: user.id,
        name: item.name,
        price: item.price,
        priority: item.priority,
        link: item.link || null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishList'] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wishlist_items' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishList'] }),
  });

  return {
    goals: goalsQuery.data || [],
    isLoadingGoals: goalsQuery.isLoading,
    addGoal,
    deleteGoal,
    updateGoalAmount,
    wishList: wishListQuery.data || [],
    isLoadingWishList: wishListQuery.isLoading,
    addItem,
    deleteItem,
  };
}