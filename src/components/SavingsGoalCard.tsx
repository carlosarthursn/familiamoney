import { useState } from 'react';
import { SavingsGoal } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Target, CalendarDays, Trash2, PlusCircle } from 'lucide-react';
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
  const { updateGoalAmount, updateGoal } = usePlanning();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(goal.name);
  const [editAmount, setEditAmount] = useState(String(goal.targetamount));

  const progress = Math.min(100, (goal.currentamount / goal.targetamount) * 100);
  const remaining = goal.targetamount - goal.currentamount;
  const isComplete = progress >= 100;

  const handleAddFunds = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const numAmount = parseFloat(editAmount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) return;
    updateGoal.mutate({ id: goal.id, name: editName, targetamount: numAmount });
    setIsEditing(false);
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
        {isEditing ? (
          <CardContent className="p-4">
            <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Nome da Meta</span>
                  <Input 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    className="h-10 rounded-xl font-bold bg-background/80 border border-border/50"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Valor Alvo</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">R$</span>
                    <Input 
                      type="text"
                      inputMode="decimal"
                      value={editAmount} 
                      onChange={e => setEditAmount(e.target.value.replace(/[^0-9,.]/g, ''))} 
                      className="h-10 pl-9 rounded-xl font-black text-base bg-background/80 border border-border/50"
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} 
                  className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave} 
                  className="px-4 py-1.5 bg-primary text-white text-xs font-black rounded-lg shadow-md hover:bg-primary/90 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </CardContent>
        ) : (
          <div className="cursor-pointer active:scale-[0.98] transition-transform w-full h-full" onClick={() => setIsEditing(true)}>
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2 truncate">
                <Target className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{goal.name}</span>
              </CardTitle>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
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
                  <div className="flex gap-2 animate-slide-down" onClick={e => e.stopPropagation()}>
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
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); setIsAdding(false); }}>X</Button>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full h-8 text-xs text-primary"
                    onClick={(e) => { e.stopPropagation(); setIsAdding(true); }}
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    Adicionar Economia
                  </Button>
                )}
              </div>
            </CardContent>
          </div>
        )}
      </Card>
    </>
  );
}