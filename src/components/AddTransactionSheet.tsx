import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CalendarIcon, Check, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryIcon } from '@/types/finance';
import { useTransactions } from '@/hooks/useTransactions';
import { toast } from 'sonner';

export function AddTransactionSheet() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  const { addTransaction } = useTransactions();

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setCategory('');
    setDate(new Date());
    setDescription('');
  };

  const handleSubmit = async () => {
    if (!amount || !category) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    try {
      await addTransaction.mutateAsync({
        type,
        amount: numAmount,
        category,
        // Ensure date is formatted correctly for Supabase
        date: format(date, 'yyyy-MM-dd'),
        description: description || undefined,
      });

      toast.success(type === 'income' ? 'Receita adicionada!' : 'Despesa adicionada!');
      resetForm();
      setOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar transação');
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg gradient-primary hover:opacity-90 z-50"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl safe-bottom">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">Nova Movimentação</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto pb-8">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategory(''); }}
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all touch-target",
                type === 'expense' 
                  ? "bg-destructive text-destructive-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TrendingDown className="h-4 w-4" />
              Despesa
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategory(''); }}
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all touch-target",
                type === 'income' 
                  ? "bg-success text-success-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TrendingUp className="h-4 w-4" />
              Receita
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Valor</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                R$
              </span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-12 h-14 text-2xl font-bold touch-target"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Categoria</Label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const IconComponent = getCategoryIcon(cat.icon);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all touch-target",
                      category === cat.id
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted hover:bg-muted/80"
                    )}
                  >
                    <IconComponent className={cn(
                      "h-5 w-5",
                      category === cat.id ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-xs font-medium text-center",
                      category === cat.id ? "text-primary" : "text-muted-foreground"
                    )}>
                      {cat.label}
                    </span>
                    {category === cat.id && (
                      <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Data</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-12 touch-target"
                >
                  <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                  {format(date, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) setDate(d);
                    setDatePickerOpen(false);
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Descrição (opcional)</Label>
            <Textarea
              placeholder="Adicione uma nota..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] touch-target"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={addTransaction.isPending}
            className={cn(
              "w-full h-14 text-base font-semibold rounded-xl touch-target",
              type === 'income' ? "gradient-income" : "gradient-expense"
            )}
          >
            {addTransaction.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}