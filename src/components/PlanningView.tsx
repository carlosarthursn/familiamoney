import { SavingsGoal, WishlistItem } from '@/types/finance';
import { SavingsGoalCard } from './SavingsGoalCard';
import { WishListItemCard } from './WishListItemCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ListChecks, Target, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlanning } from '@/hooks/usePlanning';
import { toast } from 'sonner';

// Componente auxiliar para exibir quando não há itens
function EmptyState({ icon: Icon, title, description, onAdd }: { icon: React.ElementType, title: string, description: string, onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/50 rounded-xl border border-dashed border-border">
      <Icon className="h-8 w-8 text-muted-foreground mb-3" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>
      <Button variant="secondary" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1" /> Adicionar
      </Button>
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

  // TODO: Implement AddGoalSheet and AddWishItemSheet
  const handleAddGoal = () => {
    toast.info("Funcionalidade de adicionar meta em desenvolvimento.");
  };
  
  const handleAddWishItem = () => {
    toast.info("Funcionalidade de adicionar item em desenvolvimento.");
  };
  
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
          <Button variant="ghost" size="sm" className="text-primary h-8" onClick={handleAddGoal}>
            <Plus className="h-4 w-4 mr-1" /> Nova
          </Button>
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
            onAdd={handleAddGoal}
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
          <Button variant="ghost" size="sm" className="text-primary h-8" onClick={handleAddWishItem}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
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
            onAdd={handleAddWishItem}
          />
        ) : (
          <div className="space-y-3">
            {wishList.map(item => (
              <WishListItemCard key={item.id} item={item} onDelete={handleDeleteWishItem} />
            ))}
          </div>
        )}
      </div>

      {/* Budgeting Section (Fixed/Variable Expenses) */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-primary" />
          Orçamento Mensal
        </h3>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gastos Fixos vs Variáveis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aqui você poderá definir orçamentos para suas categorias de despesas fixas e variáveis e acompanhar seu progresso.
            </p>
            <Button variant="secondary" className="mt-3 w-full">
              Configurar Orçamento
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}