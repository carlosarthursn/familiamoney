import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, ListChecks, Link } from 'lucide-react';
import { usePlanning } from '@/hooks/usePlanning';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';

const wishItemSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  price: z.string().refine(val => !isNaN(parseFloat(val.replace(',', '.')) && parseFloat(val.replace(',', '.')) > 0), {
    message: 'Preço deve ser um número positivo',
  }),
  priority: z.enum(['high', 'medium', 'low'], {
    required_error: 'Selecione a prioridade',
  }),
  link: z.string().url('Link inválido').optional().or(z.literal('')),
});

type WishItemFormValues = z.infer<typeof wishItemSchema>;

const priorityOptions = [
  { id: 'high', label: 'Alta', color: 'text-destructive' },
  { id: 'medium', label: 'Média', color: 'text-warning' },
  { id: 'low', label: 'Baixa', color: 'text-primary' },
];

export function AddWishItemSheet() {
  const [open, setOpen] = useState(false);
  const { addItem } = usePlanning();

  const form = useForm<WishItemFormValues>({
    resolver: zodResolver(wishItemSchema),
    defaultValues: {
      name: '',
      price: '',
      priority: 'medium',
      link: '',
    },
  });

  const onSubmit = async (values: WishItemFormValues) => {
    const price = parseFloat(values.price.replace(',', '.'));
    
    try {
      await addItem.mutateAsync({
        name: values.name,
        price: price,
        priority: values.priority,
        link: values.link || null,
      });
      
      toast.success(`Item "${values.name}" adicionado à lista!`);
      form.reset();
      setOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar item:', error);
      toast.error(error.message || 'Erro ao salvar item. Verifique sua conexão.');
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="text-primary h-8">
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="text-xl flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            Novo Item de Desejo
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
                    <FormLabel className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Nome do Item</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Novo celular" className="h-12 rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Preço Estimado (R$)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                          R$
                        </span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="1.500,00"
                          className="pl-12 h-12 text-xl font-bold rounded-xl"
                          {...field}
                          onChange={(e) => {
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
              
              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions.map(option => (
                          <SelectItem key={option.id} value={option.id}>
                            <span className={cn("font-medium", option.color)}>{option.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Link (Optional) */}
              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Link do Produto (Opcional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Link className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="https://loja.com/produto" 
                          className="pl-12 h-12 rounded-xl" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-10 safe-bottom">
              <Button
                type="submit"
                disabled={addItem.isPending}
                className="w-full h-12 text-base font-semibold rounded-xl shadow-lg gradient-primary"
              >
                {addItem.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando Item...
                  </div>
                ) : 'Salvar Item'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}