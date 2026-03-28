"use client";

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Settings2, Loader2, Check } from 'lucide-react';
import { differenceInDays, endOfMonth, startOfDay } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { SuccessOverlay } from './SuccessOverlay';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function DailyBudgetCard() {
  const { profile, updateProfile } = useAuth();
  const { personalExpenses } = useTransactions();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newBudget, setNewBudget] = useState(String(profile?.monthly_budget || 0));
  const [loading, setLoading] = useState(false);

  const budget = profile?.monthly_budget || 0;

  const dailyAmount = useMemo(() => {
    const today = startOfDay(new Date());
    const lastDayOfMonth = endOfMonth(today);
    const daysRemaining = differenceInDays(lastDayOfMonth, today) + 1;
    
    if (budget <= 0) return 0;
    
    const remainingBudget = budget - personalExpenses;
    if (remainingBudget <= 0) return 0;
    
    return remainingBudget / daysRemaining;
  }, [budget, personalExpenses]);

  const handleUpdateBudget = async () => {
    const val = parseFloat(newBudget.replace(',', '.'));
    if (isNaN(val) || val < 0) {
      toast.error('Digite um valor válido');
      return;
    }

    setLoading(true);
    const { error } = await updateProfile({ monthly_budget: val });
    setLoading(false);

    if (error) {
      toast.error('Erro ao atualizar orçamento.');
    } else {
      setShowSuccess(true);
    }
  };

  return (
    <>
      {showSuccess && (
        <SuccessOverlay 
          message="Orçamento atualizado!" 
          onFinished={() => {
            setShowSuccess(false);
            setIsEditing(false);
          }} 
        />
      )}
      
      <Card className="border-none shadow-sm bg-muted/30">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center border border-border">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">
                {budget > 0 ? 'Disponível p/ hoje' : 'Defina seu orçamento mensal'}
              </p>
              <p className="text-lg font-bold text-foreground">
                {budget > 0 ? formatCurrency(dailyAmount) : 'R$ 0,00'}
              </p>
              {budget > 0 && (
                <p className="text-[9px] text-muted-foreground">
                  Baseado no seu limite de {formatCurrency(budget)}/mês
                </p>
              )}
            </div>
          </div>

          <Sheet open={isEditing} onOpenChange={setIsEditing}>
            <SheetTrigger asChild>
              <button 
                className="h-8 w-8 rounded-full flex items-center justify-center bg-background border border-border hover:bg-accent transition-colors"
                aria-label="Configurar orçamento pessoal"
              >
                <Settings2 className="h-4 w-4 text-muted-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl pb-10">
              <SheetHeader>
                <SheetTitle>Orçamento Mensal Pessoal</SheetTitle>
                <SheetDescription>
                  Quanto você pretende gastar no máximo por mês com suas despesas pessoais?
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Valor Mensal (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                    <Input 
                      type="number" 
                      placeholder="2.000,00" 
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      className="pl-10 h-12 text-lg font-bold rounded-xl"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleUpdateBudget} 
                  disabled={loading}
                  className="w-full h-12 rounded-xl gradient-primary"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Salvar Orçamento
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>
    </>
  );
}