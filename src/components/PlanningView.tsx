import { SavingsGoal, WishlistItem } from '@/types/finance';
import { SavingsGoalCard } from './SavingsGoalCard';
import { WishListItemCard } from './WishListItemCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ListChecks, Target, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock Data for demonstration
const mockGoals: SavingsGoal[] = [
  { id: '1', name: 'Reserva de Emergência', targetAmount: 10000, currentAmount: 7500, targetDate: '2025-12-31' },
  { id: '2', name: 'Viagem para Europa', targetAmount: 5000, currentAmount: 5500, targetDate: '2024-11-01' },
];

const mockWishList: WishlistItem[] = [
  { id: 'w1', name: 'Novo Smartphone', price: 4500, priority: 'high', link: 'https://example.com/phone' },
  { id: 'w2', name: 'Cadeira Gamer', price: 1200, priority: 'medium' },
  { id: 'w3', name: 'Curso de Programação', price: 300, priority: 'low' },
];

export function PlanningView() {
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
          <Button variant="ghost" size="sm" className="text-primary h-8">
            <Plus className="h-4 w-4 mr-1" /> Nova
          </Button>
        </div>
        <div className="space-y-3">
          {mockGoals.map(goal => (
            <SavingsGoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      </div>

      {/* Wish List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2 text-lg">
            <ListChecks className="h-5 w-5 text-primary" />
            Lista de Desejos
          </h3>
          <Button variant="ghost" size="sm" className="text-primary h-8">
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>
        <div className="space-y-3">
          {mockWishList.map(item => (
            <WishListItemCard key={item.id} item={item} />
          ))}
        </div>
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