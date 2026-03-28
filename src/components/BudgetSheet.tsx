import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EXPENSE_CATEGORIES, getCategoryIcon } from '@/types/finance';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Save, Trash2, RotateCcw } from 'lucide-react';
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
      // Inicializa com as categorias padrão mescladas com o que está no banco
      const initial = EXPENSE_CATEGORIES.map(cat => {
        const saved = budgets?.find(b => b.category === cat.id);
        return {
          id: cat.id,
          limit: saved ? String(saved.monthly_limit) : '',
          label: saved?.custom_label || cat.label,
          isDeleted: saved ? false : false // Por padrão mostramos todas as base
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

      // Remove orçamentos antigos
      await supabase.from('budgets' as any).delete().eq('user_id', user.id);
      
      // Insere os novos (apenas os que não foram excluídos e têm valor)
      if (entries.length > 0) {
        const { error } = await supabase.from('budgets' as any).insert(entries);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setShowSuccess(true);
    },
    onError: () => toast.error('Erro ao salvar orçamento'),
  });

  const updateCategory = (id: string, updates: Partial<CategoryState>) => {
    setLocalCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  return (
    <>
      {showSuccess && (
        <SuccessOverlay 
          message="Orçamentos salvos!" 
          onFinished={() => {
            setShowSuccess(false);
            setOpen(false);
          }} 
        />
      )}
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="secondary" className="w-full">
            Configurar Orçamento
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl flex flex-col p-0">
          <SheetHeader className="p-6 pb-2">
            <SheetTitle>Personalizar Orçamento</SheetTitle>
          </SheetHeader>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 pb-24">
              <div className="space-y-4 pt-2">
                {localCategories.map(cat => {
                  const Icon = getCategoryIcon(EXPENSE_CATEGORIES.find(c => c.id === cat.id)?.icon || 'Circle');
                  
                  if (cat.isDeleted) return null;

                  return (
                    <div key={cat.id} className="bg-muted/30 p-3 rounded-2xl space-y-3 border border-transparent hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center shrink-0 shadow-sm">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <Input
                          value={cat.label}
                          onChange={e => updateCategory(cat.id, { label: e.target.value })}
                          className="h-9 border-none bg-transparent font-bold focus-visible:ring-0 p-0 text-sm"
                          placeholder="Nome da categoria"
                        />
                        <button 
                          onClick={() => updateCategory(cat.id, { isDeleted: true, limit: '0' })}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground w-20">Limite Mensal</Label>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">R$</span>
                          <Input
                            type="number"
                            placeholder="0,00"
                            value={cat.limit}
                            onChange={e => updateCategory(cat.id, { limit: e.target.value })}
                            className="h-10 pl-9 rounded-xl border-none bg-background shadow-inner"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {localCategories.some(c => c.isDeleted) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-muted-foreground text-xs h-8 border-dashed border border-muted"
                    onClick={() => setLocalCategories(prev => prev.map(c => ({ ...c, isDeleted: false })))}
                  >
                    <RotateCcw className="h-3 w-3 mr-2" /> Restaurar categorias ocultas
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-10 safe-bottom">
            <Button 
              onClick={() => saveMutation.mutate()} 
              disabled={saveMutation.isPending}
              className="w-full h-14 rounded-2xl shadow-lg gradient-primary font-bold text-lg"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              Salvar Orçamentos
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}