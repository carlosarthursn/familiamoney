import { SavingsGoal, WishlistItem } from '@/types/finance';
import { SavingsGoalCard } from './SavingsGoalCard';
import { WishListItemCard } from './WishListItemCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ListChecks, Target, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlanning } from '@/hooks/usePlanning';
import { toast } from 'sonner';
import { AddGoalSheet } from './AddGoalSheet';
import { AddWishItemSheet } from './AddWishItemSheet';
import { BudgetSheet } from './BudgetSheet';
import { BudgetProgress } from './BudgetProgress';

// Componente auxiliar para exibir quando não há itens
function EmptyState({ icon: Icon, title, description, trigger }: { icon: React.ElementType, title: string, description: string, trigger: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/50 rounded-xl border border-dashed border-border">
      <Icon className="h-8 w-8 text-muted-foreground mb-3" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>
      {trigger}
    </div>
  );
}

export function PlanningView() {
  const { 
    goals, 
    isLoadingGoals, 
    deleteGoal, 
    wishList, 
    isLoadingWishList, 
    deleteItem 
  } = usePlanning();

  const handleDeleteGoal = (id: string) => {
    deleteGoal.mutate(id, {
      onSuccess: () => toast.success('Meta removida'),
      onError: () => toast.error('Erro ao remover meta'),
    });
  };
  
  const handleDeleteWishItem = (id: string) => {
    deleteItem.mutate(id, {
      onSuccess: () => toast.success('Item removido'),
      onError: () => toast.error('Erro ao remover item'),
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold">Planejamento Financeiro</h2>

      {/* Savings Goals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Metas de Poupança
          </h3>
          <AddGoalSheet />
        </div>
        
        {isLoadingGoals ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : goals.length === 0 ? (
          <EmptyState 
            icon={Target} 
            title="Nenhuma meta definida" 
            description="Comece a planejar seu futuro financeiro."
            trigger={<AddGoalSheet />}
          />
        ) : (
          <div className="space-y-3">
            {goals.map(goal => (
              <SavingsGoalCard key={goal.id} goal={goal} onDelete={handleDeleteGoal} />
            ))}
          </div>
        )}
      </div>

      {/* Wish List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2 text-lg">
            <ListChecks className="h-5 w-5 text-primary" />
            Lista de Desejos
          </h3>
          <AddWishItemSheet />
        </div>
        
        {isLoadingWishList ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : wishList.length === 0 ? (
          <EmptyState 
            icon={ListChecks} 
            title="Lista de desejos vazia" 
            description="Adicione itens que você planeja comprar."
            trigger={<AddWishItemSheet />}
          />
        ) : (
          <div className="space-y-3">
            {wishList.map(item => (
              <WishListItemCard key={item.id} item={item} onDelete={handleDeleteWishItem} />
            ))}
          </div>
        )}
      </div>

      {/* Budgeting Section */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-primary" />
          Orçamento Mensal
        </h3>
        
        <BudgetProgress selectedDate={new Date()} />
        
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Defina limites mensais por categoria e acompanhe seus gastos.
            </p>
            <BudgetSheet />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}