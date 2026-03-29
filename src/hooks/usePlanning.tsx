import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SavingsGoal, WishlistItem } from '@/types/finance';
import { useAuth } from './useAuth';

export function usePlanning() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  const userIds = [user?.id].filter(Boolean) as string[];
  if (profile?.linked_user_id) userIds.push(profile.linked_user_id);

  const goalsCacheKey = `confere_goals_${userIds.sort().join(',')}`;
  const wishCacheKey = `confere_wish_${userIds.sort().join(',')}`;

  // --- Savings Goals ---
  const goalsQuery = useQuery({
    queryKey: ['savingsGoals', userIds.sort().join(',')],
    queryFn: async (): Promise<SavingsGoal[]> => {
      if (userIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .in('user_id', userIds)
        .order('targetdate', { ascending: true });

      if (error) throw error;
      const formatted = (data || []) as SavingsGoal[];

      try { localStorage.setItem(goalsCacheKey, JSON.stringify(formatted)); } catch (e) {}
      return formatted;
    },
    initialData: () => {
      try {
        const cached = localStorage.getItem(goalsCacheKey);
        if (cached) return JSON.parse(cached);
      } catch (e) {}
      return undefined;
    },
    enabled: !!user,
    staleTime: 0,
  });

  const addGoal = useMutation({
    mutationFn: async (goal: Omit<SavingsGoal, 'id'>) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase.from('savings_goals').insert({ 
        user_id: user.id,
        name: goal.name,
        targetamount: goal.targetamount,
        currentamount: goal.currentamount,
        targetdate: goal.targetdate,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savingsGoals'] }),
  });

  const updateGoalAmount = useMutation({
    mutationFn: async ({ id, amountChange }: { id: string, amountChange: number }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data: goal, error: fetchError } = await supabase
        .from('savings_goals')
        .select('currentamount')
        .eq('id', id)
        .single();
      
      if (fetchError || !goal) throw new Error('Meta não encontrada');
      
      // Converte explicitamente para número para evitar soma de strings
      const currentVal = Number(goal.currentamount || 0);
      const newVal = currentVal + amountChange;
      
      const { error } = await supabase
        .from('savings_goals')
        .update({ currentamount: newVal })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savingsGoals'] }),
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, name, targetamount }: { id: string, name?: string, targetamount?: number }) => {
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (targetamount !== undefined) updates.targetamount = targetamount;
      const { error } = await supabase.from('savings_goals').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savingsGoals'] }),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id);
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
        .from('wishlist_items')
        .select('*')
        .in('user_id', userIds)
        .order('priority', { ascending: false });

      if (error) throw error;
      const formatted = (data || []) as WishlistItem[];

      try { localStorage.setItem(wishCacheKey, JSON.stringify(formatted)); } catch (e) {}
      return formatted;
    },
    initialData: () => {
      try {
        const cached = localStorage.getItem(wishCacheKey);
        if (cached) return JSON.parse(cached);
      } catch (e) {}
      return undefined;
    },
    enabled: !!user,
    staleTime: 0,
  });

  const addItem = useMutation({
    mutationFn: async (item: Omit<WishlistItem, 'id'>) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase.from('wishlist_items').insert({ 
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

  const updateItem = useMutation({
    mutationFn: async ({ id, name, price }: { id: string, name?: string, price?: number }) => {
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (price !== undefined) updates.price = price;
      const { error } = await supabase.from('wishlist_items').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishList'] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wishlist_items').delete().eq('id', id);
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
    updateGoal,
    wishList: wishListQuery.data || [],
    isLoadingWishList: wishListQuery.isLoading,
    addItem,
    deleteItem,
    updateItem,
  };
}