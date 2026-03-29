"use client";

import { useState } from 'react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/finance';
import { useRecurring } from '@/hooks/useRecurring';
import { Plus, TrendingUp, TrendingDown, Repeat, Loader2, X } from 'lucide-react';
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
    const numAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
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
    } catch (e) {}
  };

  return (
    <>
      {showSuccess && <SuccessOverlay message="Configurado!" onFinished={() => { setShowSuccess(false); setOpen(false); }} />}
      
      <Drawer open={open} onOpenChange={setOpen}>
        <button 
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-primary text-xs font-bold hover:opacity-80 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Novo
        </button>
        <DrawerContent className="h-[92vh] rounded-t-[2.5rem] bg-background border-none shadow-2xl">
          <DrawerHeader className="px-8 pt-4 pb-0 relative">
            <div className="mx-auto w-12 h-1 rounded-full bg-muted/40 mb-6" />
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-2xl font-black tracking-tighter flex items-center gap-2">
                Planejamento <Repeat className="h-5 w-5 text-primary" />
              </DrawerTitle>
              <DrawerClose asChild>
                <button className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </DrawerClose>
            </div>
            <DrawerDescription className="sr-only">Configure seus gastos ou ganhos fixos mensais.</DrawerDescription>
          </DrawerHeader>
          
          <div className="flex-1 overflow-y-auto px-8 pb-32 space-y-8 pt-8">
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-muted/30 rounded-2xl">
              <button onClick={() => setType('expense')} className={cn("flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all", type === 'expense' ? "bg-destructive text-white shadow-md" : "text-muted-foreground")}>
                <TrendingDown className="h-4 w-4" /> Gasto
              </button>
              <button onClick={() => setType('income')} className={cn("flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all", type === 'income' ? "bg-success text-white shadow-md" : "text-muted-foreground")}>
                <TrendingUp className="h-4 w-4" /> Ganho
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Nome do Lançamento</Label>
              <Input placeholder={type === 'income' ? "Ex: Aluguel, Salário" : "Ex: Netflix, Internet"} value={name} onChange={e => setName(e.target.value)} className="h-14 rounded-2xl bg-muted/20 border-none font-bold" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Valor (R$)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                  <Input type="text" inputMode="decimal" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} className="pl-10 h-14 rounded-2xl bg-muted/20 border-none font-black text-lg" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Vencimento (Dia)</Label>
                <Input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className="h-14 rounded-2xl bg-muted/20 border-none font-bold" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Categoria</Label>
              <Select onValueChange={setCategory} value={category}>
                <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-none px-5 font-bold">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {type === 'expense' && (
              <div className="space-y-4 p-5 bg-muted/20 rounded-[2rem]">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">É parcelado / Cartão?</Label>
                    <p className="text-[10px] text-muted-foreground">Ex: Compras em 12x, Fatura</p>
                  </div>
                  <Switch checked={isInstallment} onCheckedChange={setIsInstallment} />
                </div>
                {isInstallment && (
                  <div className="animate-slide-down space-y-2 pt-2 border-t border-muted">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Total de Parcelas</Label>
                    <Input type="number" value={totalInstallments} onChange={e => setTotalInstallments(e.target.value)} className="h-12 rounded-xl bg-background/50 border-none" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background via-background to-transparent pt-12 safe-bottom z-10">
            <Button onClick={handleSubmit} disabled={addRecurring.isPending} className={cn("w-full h-16 rounded-2xl font-black text-lg shadow-xl", type === 'income' ? "gradient-income" : "gradient-primary")}>
              {addRecurring.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar Planejamento'}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}