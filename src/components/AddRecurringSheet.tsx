"use client";

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryIcon } from '@/types/finance';
import { useRecurring } from '@/hooks/useRecurring';
import { Plus, TrendingUp, TrendingDown, Repeat, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SuccessOverlay } from './SuccessOverlay';

export function AddRecurringSheet() {
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('12');
  
  const { addRecurring } = useRecurring();
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async () => {
    if (!name || !amount || !category) return;
    
    const numAmount = parseFloat(amount.replace(',', '.'));
    const numDueDay = parseInt(dueDay);

    try {
      await addRecurring.mutateAsync({
        name,
        amount: numAmount,
        category,
        due_day: numDueDay,
        type,
        is_installment: type === 'expense' ? isInstallment : false,
        total_installments: (type === 'expense' && isInstallment) ? parseInt(totalInstallments) : null,
        current_installment: (type === 'expense' && isInstallment) ? 1 : null,
      });
      setShowSuccess(true);
      setName(''); setAmount(''); setCategory('');
    } catch (e) {}
  };

  return (
    <>
      {showSuccess && <SuccessOverlay message="Configurado!" onFinished={() => { setShowSuccess(false); setOpen(false); }} />}
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="text-primary h-8">
            <Plus className="h-4 w-4 mr-1" /> Novo
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-6 bg-background">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-primary" /> Planejamento Recorrente
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6 overflow-y-auto pb-20">
            {/* Seletor de Tipo */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-2xl">
              <button 
                type="button" 
                onClick={() => { setType('expense'); setCategory(''); }} 
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all", 
                  type === 'expense' ? "bg-destructive text-white shadow-sm" : "text-muted-foreground"
                )}
              >
                <TrendingDown className="h-4 w-4" /> Gasto
              </button>
              <button 
                type="button" 
                onClick={() => { setType('income'); setCategory(''); }} 
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all", 
                  type === 'income' ? "bg-success text-white shadow-sm" : "text-muted-foreground"
                )}
              >
                <TrendingUp className="h-4 w-4" /> Ganho
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Nome</Label>
              <Input placeholder={type === 'income' ? "Ex: Salário, Aluguel Recebido" : "Ex: Netflix, Internet"} value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Valor Estimado</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">R$</span>
                  <Input type="text" inputMode="decimal" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} className="pl-9 h-12 rounded-xl font-bold" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Dia do Mês</Label>
                <Input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className="h-12 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Categoria</Label>
              <Select onValueChange={setCategory} value={category}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {type === 'expense' && (
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">É parcelado / Cartão?</Label>
                  <p className="text-[10px] text-muted-foreground">Ex: Compras em 10x, Fatura</p>
                </div>
                <Switch checked={isInstallment} onCheckedChange={setIsInstallment} />
              </div>
            )}

            {type === 'expense' && isInstallment && (
              <div className="animate-slide-down space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Total de Parcelas</Label>
                <Input type="number" value={totalInstallments} onChange={e => setTotalInstallments(e.target.value)} className="h-12 rounded-xl" />
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background pt-10 safe-bottom">
            <Button 
              onClick={handleSubmit} 
              disabled={addRecurring.isPending} 
              className={cn(
                "w-full h-14 rounded-2xl font-bold text-lg",
                type === 'income' ? "gradient-income" : "gradient-primary"
              )}
            >
              {addRecurring.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}