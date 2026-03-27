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
import { Loader2, Save } from 'lucide-react';

interface BudgetRow {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
}

export function BudgetSheet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [limits, setLimits] = useState<Record<string, string>>({});

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
    if (budgets) {
      const map: Record<string, string> = {};
      budgets.forEach(b => {
        map[b.category] = String(b.monthly_limit);
      });
      setLimits(map);
    }
  }, [budgets]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Não autenticado');
      
      const entries = Object.entries(limits)
        .filter(([_, val]) => val && Number(val) > 0)
        .map(([category, val]) => ({
          user_id: user.id,
          category,
          monthly_limit: Number(val),
        }));

      // Delete existing and re-insert
      await supabase.from('budgets' as any).delete().eq('user_id', user.id);
      
      if (entries.length > 0) {
        const { error } = await supabase.from('budgets' as any).insert(entries);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Orçamento salvo!');
      setOpen(false);
    },
    onError: () => toast.error('Erro ao salvar orçamento'),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" className="w-full">
          Configurar Orçamento
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Orçamento por Categoria</SheetTitle>
        </SheetHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(85vh-140px)] pb-4">
            {EXPENSE_CATEGORIES.map(cat => {
              const Icon = getCategoryIcon(cat.icon);
              return (
                <div key={cat.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Label className="text-sm flex-1 min-w-0 truncate">{cat.label}</Label>
                  <div className="w-28 shrink-0">
                    <Input
                      type="number"
                      placeholder="R$ 0"
                      value={limits[cat.id] || ''}
                      onChange={e => setLimits(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              );
            })}
            
            <Button 
              onClick={() => saveMutation.mutate()} 
              disabled={saveMutation.isPending}
              className="w-full mt-4"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Orçamento
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
