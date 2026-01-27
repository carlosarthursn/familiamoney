import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CalendarIcon, Check, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
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
        date: format(date, 'yyyy-MM-dd'),
        description: description || undefined,
      });
      
      toast.success(type === 'income' ? 'Receita adicionada!' : 'Despesa adicionada!');
      resetForm();
      setOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.message || 'Erro ao salvar. Verifique sua conexão.');
    }
  };
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          size="lg" 
          // Ajustando a posição para bottom-28 (7rem) para garantir que fique bem acima da barra de navegação e da safe area.
          className="fixed bottom-28 right-6 h-14 w-14 rounded-full shadow-lg gradient-primary hover:opacity-90 z-50"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="text-xl">Nova Movimentação</SheetTitle>
          <SheetDescription className="sr-only">
            Adicione detalhes sobre sua nova receita ou despesa.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-6 pb-24">
          <div className="space-y-4 py-2">
            {/* Type Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setCategory('');
                }}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all text-sm",
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
                onClick={() => {
                  setType('income');
                  setCategory('');
                }}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all text-sm",
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
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Valor</Label>
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
                  className="pl-12 h-12 text-xl font-bold rounded-xl"
                />
              </div>
            </div>
            
            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Categoria</Label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const IconComponent = getCategoryIcon(cat.icon);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        "relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all",
                        category === cat.id 
                          ? "border-primary bg-primary/5" 
                          : "border-transparent bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span className={cn(
                        "text-[10px] font-medium text-center truncate w-full",
                        category === cat.id 
                          ? "text-primary" 
                          : "text-muted-foreground"
                      )}>
                        {cat.label}
                      </span>
                      {category === cat.id && (
                        <div className="absolute top-1 right-1">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Date */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Data</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-11 text-sm rounded-xl"
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
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Descrição (opcional)</Label>
              <Textarea
                placeholder="Adicione uma nota..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[60px] text-sm rounded-xl resize-none"
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-10 safe-bottom">
          <Button
            onClick={handleSubmit}
            disabled={addTransaction.isPending}
            className={cn(
              "w-full h-12 text-base font-semibold rounded-xl shadow-lg",
              type === 'income' ? "gradient-income" : "gradient-expense"
            )}
          >
            {addTransaction.isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </div>
            ) : 'Salvar Movimentação'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}