import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SavingsGoal, WishlistItem } from '@/types/finance';
import { useAuth } from './useAuth';

// Database row types
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // --- Savings Goals Queries/Mutations ---

  const goalsQuery = useQuery({
    queryKey: ['savingsGoals', userId],
    queryFn: async (): Promise<SavingsGoal[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('savings_goals' as any)
        .select('*')
        .eq('user_id', userId)
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
    enabled: !!userId,
  });

  const addGoal = useMutation({
    mutationFn: async (goal: Omit<SavingsGoal, 'id'>) => {
      if (!userId) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('savings_goals' as any)
        .insert({ 
          user_id: userId,
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          targetDate: goal.targetDate,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals', userId] });
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('savings_goals' as any)
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
        .from('savings_goals' as any)
        .select('currentAmount')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
        
      if (fetchError || !currentGoal) throw fetchError || new Error('Meta não encontrada');
      
      const goalData = currentGoal as unknown as { currentAmount: number };
      const newAmount = goalData.currentAmount + amountChange;

      // 2. Update the goal
      const { error: updateError } = await supabase
        .from('savings_goals' as any)
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
        .from('wishlist_items' as any)
        .select('*')
        .eq('user_id', userId)
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
    enabled: !!userId,
  });

  const addItem = useMutation({
    mutationFn: async (item: Omit<WishlistItem, 'id'>) => {
      if (!userId) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('wishlist_items' as any)
        .insert({ 
          user_id: userId,
          name: item.name,
          price: item.price,
          priority: item.priority,
          link: item.link || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishList', userId] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('wishlist_items' as any)
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