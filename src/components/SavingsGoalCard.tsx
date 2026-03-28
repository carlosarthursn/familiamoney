import { useState } from 'react';
import { SavingsGoal } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Target, CalendarDays, Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePlanning } from '@/hooks/usePlanning';
import { toast } from 'sonner';
import { SuccessOverlay } from './SuccessOverlay';

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
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState('');
  const { updateGoalAmount } = usePlanning();

  const progress = Math.min(100, (goal.currentamount / goal.targetamount) * 100);
  const remaining = goal.targetamount - goal.currentamount;
  const isComplete = progress >= 100;

  const handleAddFunds = async () => {
    const val = parseFloat(amountToAdd.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    try {
      await updateGoalAmount.mutateAsync({ id: goal.id, amountChange: val });
      setShowSuccess(true);
      setAmountToAdd('');
      setIsAdding(false);
    } catch (error) {
      toast.error('Erro ao atualizar meta');
    }
  };

  return (
    <>
      {showSuccess && (
        <SuccessOverlay 
          message="Economia salva!" 
          onFinished={() => setShowSuccess(false)} 
        />
      )}
      
      <Card className="shadow-card group transition-all hover:shadow-card-hover overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-start justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2 truncate">
            <Target className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{goal.name}</span>
          </CardTitle>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-2 text-muted-foreground hover:text-destructive transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progresso:</span>
            <span className={cn("font-medium", isComplete ? "text-success" : "text-primary")}>
              {formatCurrency(goal.currentamount)} / {formatCurrency(goal.targetamount)}
            </span>
          </div>
          
          <Progress value={progress} className={cn("h-2", isComplete && "[&>div]:bg-success")} />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              <span>Meta: {format(new Date(goal.targetdate + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
            <span className={cn(isComplete ? "text-success font-medium" : "text-destructive font-medium")}>
              {isComplete ? 'Concluído!' : `${formatCurrency(remaining)} restantes`}
            </span>
          </div>

          <div className="pt-2 border-t border-border/50">
            {isAdding ? (
              <div className="flex gap-2 animate-slide-down">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Valor"
                  value={amountToAdd}
                  onChange={(e) => setAmountToAdd(e.target.value)}
                  className="h-8 text-xs"
                  autoFocus
                />
                <Button size="sm" className="h-8 text-xs" onClick={handleAddFunds}>OK</Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setIsAdding(false)}>X</Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full h-8 text-xs text-primary"
                onClick={() => setIsAdding(true)}
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                Adicionar Economia
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}