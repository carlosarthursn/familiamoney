import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SavingsGoal, WishlistItem } from '@/types/finance';
import { useAuth } from './useAuth';

export function usePlanning() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // --- Savings Goals Queries/Mutations ---

  const goalsQuery = useQuery({
    queryKey: ['savingsGoals', userId],
    queryFn: async (): Promise<SavingsGoal[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', userId)
        .order('targetDate', { ascending: true });

      if (error) throw error;
      return data as SavingsGoal[];
    },
    enabled: !!userId,
  });

  const addGoal = useMutation({
    mutationFn: async (goal: Omit<SavingsGoal, 'id' | 'user_id'>) => {
      if (!userId) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('savings_goals')
        .insert({ ...goal, user_id: userId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals', userId] });
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals', userId] });
    },
  });
  
  // Mutation para adicionar/subtrair valor de uma meta
  const updateGoalAmount = useMutation({
    mutationFn: async ({ id, amountChange }: { id: string, amountChange: number }) => {
      if (!userId) throw new Error('Usuário não autenticado');
      
      // 1. Fetch current goal amount
      const { data: currentGoal, error: fetchError } = await supabase
        .from('savings_goals')
        .select('currentAmount')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
        
      if (fetchError || !currentGoal) throw fetchError || new Error('Meta não encontrada');
      
      const newAmount = currentGoal.currentAmount + amountChange;

      // 2. Update the goal
      const { error: updateError } = await supabase
        .from('savings_goals')
        .update({ currentAmount: newAmount })
        .eq('id', id)
        .eq('user_id', userId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals', userId] });
    },
  });


  // --- Wish List Queries/Mutations ---

  const wishListQuery = useQuery({
    queryKey: ['wishList', userId],
    queryFn: async (): Promise<WishlistItem[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: false }); // High priority first

      if (error) throw error;
      return data as WishlistItem[];
    },
    enabled: !!userId,
  });

  const addItem = useMutation({
    mutationFn: async (item: Omit<WishlistItem, 'id' | 'user_id'>) => {
      if (!userId) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('wishlist_items')
        .insert({ ...item, user_id: userId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishList', userId] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishList', userId] });
    },
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