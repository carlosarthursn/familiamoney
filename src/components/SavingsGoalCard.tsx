import { SavingsGoal } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Target, CalendarDays, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onDelete: (id: string) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function SavingsGoalCard({ goal, onDelete }: SavingsGoalCardProps) {
  const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  const remaining = goal.targetAmount - goal.currentAmount;
  const isComplete = progress >= 100;

  return (
    <Card className="shadow-card group transition-all hover:shadow-card-hover">
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {goal.name}
        </CardTitle>
        <button
          onClick={() => onDelete(goal.id)}
          className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive transition-all touch-target -mr-2"
          aria-label="Excluir meta"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progresso:</span>
          <span className={cn("font-medium", isComplete ? "text-success" : "text-primary")}>
            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
          </span>
        </div>
        
        <Progress value={progress} className={`h-2 ${isComplete ? '[&>div]:bg-success' : ''}`} />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            <span>Meta: {format(new Date(goal.targetDate), 'dd/MM/yyyy', { locale: ptBR })}</span>
          </div>
          <span className={cn(isComplete ? "text-success font-medium" : "text-destructive font-medium")}>
            {isComplete ? 'Concluído!' : `${formatCurrency(remaining)} restantes`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}