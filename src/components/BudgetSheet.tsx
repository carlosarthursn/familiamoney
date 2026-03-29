"use client";

import { useState, useEffect } from 'react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerClose,
  DrawerTrigger 
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EXPENSE_CATEGORIES, getCategoryIcon } from '@/types/finance';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Save, Trash2, RotateCcw, X } from 'lucide-react';
import { SuccessOverlay } from './SuccessOverlay';

interface BudgetRow {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  custom_label: string | null;
}

interface CategoryState {
  id: string;
  limit: string;
  label: string;
  isDeleted?: boolean;
}

export function BudgetSheet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [localCategories, setLocalCategories] = useState<CategoryState[]>([]);

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('budgets' as any)
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data as unknown as BudgetRow[];
    },
    enabled: !!user?.id && open,
  });

  useEffect(() => {
    if (open) {
      const initial = EXPENSE_CATEGORIES.map(cat => {
        const saved = budgets?.find(b => b.category === cat.id);
        return {
          id: cat.id,
          limit: saved ? String(saved.monthly_limit) : '',
          label: saved?.custom_label || cat.label,
          isDeleted: false
        };
      });
      setLocalCategories(initial);
    }
  }, [budgets, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Não autenticado');
      const entries = localCategories
        .filter(cat => !cat.isDeleted && cat.limit && Number(cat.limit) > 0)
        .map(cat => ({
          user_id: user.id,
          category: cat.id,
          monthly_limit: Number(cat.limit),
          custom_label: cat.label,
        }));

      await supabase.from('budgets' as any).delete().eq('user_id', user.id);
      if (entries.length > 0) {
        const { error } = await supabase.from('budgets' as any).insert(entries);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setShowSuccess(true);
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const updateCategory = (id: string, updates: Partial<CategoryState>) => {
    setLocalCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  return (
    <>
      {showSuccess && <SuccessOverlay message="Orçamentos salvos!" onFinished={() => { setShowSuccess(false); setOpen(false); }} />}
      
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="secondary" className="w-full h-11 rounded-xl font-bold bg-muted hover:bg-muted/80">
            Personalizar Orçamento
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[92vh] rounded-t-[2.5rem] bg-background border-none outline-none">
          <DrawerHeader className="px-8 pt-4 pb-0 relative">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-4" />
            <DrawerTitle className="text-2xl font-black tracking-tighter">Personalizar Orçamento</DrawerTitle>
            <DrawerDescription className="sr-only">Ajuste seus limites por categoria.</DrawerDescription>
            <DrawerClose asChild>
              <button className="absolute right-6 top-6 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </DrawerClose>
          </DrawerHeader>
          
          <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-4 pt-6">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-4">
                {localCategories.map(cat => {
                  const Icon = getCategoryIcon(EXPENSE_CATEGORIES.find(c => c.id === cat.id)?.icon || 'Circle');
                  if (cat.isDeleted) return null;

                  return (
                    <div key={cat.id} className="bg-muted/20 p-5 rounded-[2rem] border border-transparent hover:border-primary/20 transition-all space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-background flex items-center justify-center shadow-sm border border-border/50">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <Input
                            value={cat.label}
                            onChange={e => updateCategory(cat.id, { label: e.target.value })}
                            className="h-9 border-none bg-transparent font-black text-lg focus-visible:ring-0 p-0 w-48"
                          />
                        </div>
                        <button onClick={() => updateCategory(cat.id, { isDeleted: true, limit: '0' })} className="p-2 text-muted-foreground/40 hover:text-destructive transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Limite Mensal</Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black">R$</span>
                          <Input
                            type="number"
                            placeholder="0,00"
                            value={cat.limit}
                            onChange={e => updateCategory(cat.id, { limit: e.target.value })}
                            className="h-14 pl-12 rounded-2xl border-none bg-background shadow-inner font-black text-xl"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {localCategories.some(c => c.isDeleted) && (
                  <Button variant="ghost" className="w-full text-muted-foreground text-xs" onClick={() => setLocalCategories(prev => prev.map(c => ({ ...c, isDeleted: false })))}>
                    <RotateCcw className="h-3 w-3 mr-2" /> Restaurar categorias ocultas
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background via-background to-transparent pt-12 safe-bottom z-10">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full h-16 rounded-2xl font-black text-lg gradient-primary shadow-xl">
              {saveMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
              Salvar Orçamentos
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}