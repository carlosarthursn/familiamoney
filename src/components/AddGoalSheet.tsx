import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, CalendarIcon, Loader2, Target } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePlanning } from '@/hooks/usePlanning';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';

const goalSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  targetAmount: z.string().refine(val => !isNaN(parseFloat(val.replace(',', '.')) && parseFloat(val.replace(',', '.')) > 0), {
    message: 'Valor alvo deve ser um número positivo',
  }),
  targetDate: z.date({
    required_error: 'Selecione uma data alvo',
  }).refine(date => date > new Date(), {
    message: 'A data alvo deve ser no futuro',
  }),
});

type GoalFormValues = z.infer<typeof goalSchema>;

export function AddGoalSheet() {
  const [open, setOpen] = useState(false);
  const { addGoal } = usePlanning();

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      targetAmount: '',
      targetDate: undefined,
    },
  });

  const onSubmit = async (values: GoalFormValues) => {
    const targetAmount = parseFloat(values.targetAmount.replace(',', '.'));
    
    try {
      await addGoal.mutateAsync({
        name: values.name,
        targetAmount: targetAmount,
        currentAmount: 0, // Sempre começa em zero
        targetDate: format(values.targetDate, 'yyyy-MM-dd'),
      });
      
      toast.success(`Meta "${values.name}" adicionada!`);
      form.reset();
      setOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar meta:', error);
      toast.error(error.message || 'Erro ao salvar meta. Verifique sua conexão.');
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="text-primary h-8">
          <Plus className="h-4 w-4 mr-1" /> Nova
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="text-xl flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Nova Meta de Poupança
          </SheetTitle>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 pb-24">
            <div className="space-y-4 py-2">
              
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Nome da Meta</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Carro novo, Viagem" className="h-12 rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Target Amount */}
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Valor Alvo (R$)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                          R$
                        </span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="10.000,00"
                          className="pl-12 h-12 text-xl font-bold rounded-xl"
                          {...field}
                          onChange={(e) => {
                            // Permite apenas números e vírgula
                            const value = e.target.value.replace(/[^0-9,]/g, '');
                            field.onChange(value);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Target Date */}
              <FormField
                control={form.control}
                name="targetDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Data Alvo</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left h-11 text-sm rounded-xl",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                            {field.value ? (
                              format(field.value, "dd 'de' MMMM, yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-10 safe-bottom">
              <Button
                type="submit"
                disabled={addGoal.isPending}
                className="w-full h-12 text-base font-semibold rounded-xl shadow-lg gradient-primary"
              >
                {addGoal.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando Meta...
                  </div>
                ) : 'Salvar Meta'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}