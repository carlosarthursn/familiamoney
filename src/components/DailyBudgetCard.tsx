"use client";

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Settings2, Loader2, X } from 'lucide-react';
import { differenceInDays, endOfMonth, startOfDay } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerTrigger } from '@/components/ui/drawer';
import { SuccessOverlay } from './SuccessOverlay';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from './CurrencyInput';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function DailyBudgetCard() {
  const { profile, updateProfile } = useAuth();
  const { personalExpenses } = useTransactions();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newBudget, setNewBudget] = useState('');

  useEffect(() => {
    if (isEditing) {
      const initialRaw = Math.round((profile?.monthly_budget || 0) * 100).toString();
      setNewBudget(initialRaw === '0' ? '' : initialRaw);
    }
  }, [isEditing, profile?.monthly_budget]);

  const budget = profile?.monthly_budget || 0;
  const dailyAmount = useMemo(() => {
    const today = startOfDay(new Date());
    const daysRemaining = differenceInDays(endOfMonth(today), today) + 1;
    if (budget <= 0) return 0;
    return Math.max(0, (budget - personalExpenses) / daysRemaining);
  }, [budget, personalExpenses]);

  const handleUpdateBudget = async () => {
    const val = parseFloat(newBudget) / 100;
    if (isNaN(val) || val < 0) return toast.error('Digite um valor válido');
    setLoading(true);
    const { error } = await updateProfile({ monthly_budget: val });
    setLoading(false);
    if (error) toast.error('Erro ao atualizar.');
    else setShowSuccess(true);
  };

  return (
    <>
      {showSuccess && <SuccessOverlay message="Atualizado!" onFinished={() => { setShowSuccess(false); setIsEditing(false); }} />}
      <Card className="border-none shadow-sm bg-muted/30 rounded-[2rem] overflow-hidden">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center border border-border shadow-sm"><Calendar className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">{budget > 0 ? 'Disponível p/ hoje' : 'Defina seu orçamento'}</p>
              <p className="text-xl font-black text-foreground">{budget > 0 ? formatCurrency(dailyAmount) : 'R$ 0,00'}</p>
              {budget > 0 && <p className="text-[9px] font-bold text-muted-foreground/60">Limite: {formatCurrency(budget)}/mês</p>}
            </div>
          </div>
          <Drawer open={isEditing} onOpenChange={setIsEditing}>
            <DrawerTrigger asChild><button className="h-10 w-10 rounded-full bg-background border border-border flex items-center justify-center hover:bg-accent transition-all active:scale-95 shadow-sm"><Settings2 className="h-4 w-4 text-muted-foreground" /></button></DrawerTrigger>
            <DrawerContent className="h-[50vh] rounded-t-[2.5rem] bg-background border-none shadow-2xl">
              <DrawerHeader className="px-8 pt-4 pb-0 relative">
                <div className="mx-auto w-12 h-1 rounded-full bg-muted/40 mb-6" />
                <div className="flex items-center justify-between">
                  <DrawerTitle className="text-2xl font-black tracking-tighter">Limite Mensal</DrawerTitle>
                  <DrawerClose asChild><button className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center"><X className="h-4 w-4" /></button></DrawerClose>
                </div>
              </DrawerHeader>
              <div className="px-8 pt-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Valor Máximo do Mês</Label>
                  <CurrencyInput value={newBudget} onChange={setNewBudget} className="h-14 font-black text-2xl" />
                </div>
                <Button onClick={handleUpdateBudget} disabled={loading} className="w-full h-16 rounded-2xl gradient-primary font-black text-lg shadow-xl">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Salvar Orçamento'}</Button>
              </div>
            </DrawerContent>
          </Drawer>
        </CardContent>
      </Card>
    </>
  );
}