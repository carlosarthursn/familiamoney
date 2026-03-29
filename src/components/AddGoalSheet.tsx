"use client";

import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, CalendarIcon, Target, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePlanning } from '@/hooks/usePlanning';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { SuccessOverlay } from './SuccessOverlay';

const goalSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  targetamount: z.string().refine(val => !isNaN(parseFloat(val.replace(',', '.'))) && parseFloat(val.replace(',', '.')) > 0, { message: 'Valor deve ser positivo' }),
  targetdate: z.date({ required_error: 'Selecione a data' }),
});

export function AddGoalSheet() {
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addGoal } = usePlanning();

  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: { name: '', targetamount: '', targetdate: undefined as any },
  });

  const onSubmit = async (values: z.infer<typeof goalSchema>) => {
    try {
      await addGoal.mutateAsync({ name: values.name, targetamount: parseFloat(values.targetamount.replace(',', '.')), currentamount: 0, targetdate: format(values.targetdate, 'yyyy-MM-dd') });
      setShowSuccess(true);
    } catch (e) { toast.error('Erro ao salvar.'); }
  };

  return (
    <>
      {showSuccess && <SuccessOverlay message="Meta criada!" onFinished={() => { setShowSuccess(false); setOpen(false); }} />}
      <Drawer open={open} onOpenChange={setOpen}>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-primary text-xs font-bold hover:opacity-80 transition-opacity"><Plus className="h-4 w-4" /> Nova</button>
        <DrawerContent className="h-[92vh] rounded-t-[2.5rem] bg-background border-none shadow-2xl">
          <DrawerHeader className="px-8 pt-4 pb-0 relative">
            <div className="mx-auto w-12 h-1 rounded-full bg-muted/40 mb-6" />
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-2xl font-black tracking-tighter flex items-center gap-2">Nova Meta <Target className="h-5 w-5 text-primary" /></DrawerTitle>
              <DrawerClose asChild><button className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center"><X className="h-4 w-4" /></button></DrawerClose>
            </div>
          </DrawerHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-8 pt-8 pb-32 space-y-8">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">O que você está planejando?</FormLabel>
                  <FormControl><Input placeholder="Ex: Viagem, Carro Novo" className="h-14 rounded-2xl bg-muted/20 border-none font-bold" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="targetamount" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Quanto quer poupar? (R$)</FormLabel>
                  <FormControl><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span><Input placeholder="0,00" className="pl-10 h-14 rounded-2xl bg-muted/20 border-none font-black text-2xl" {...field} /></div></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="targetdate" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Data Limite</FormLabel>
                  <Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className="w-full justify-start h-14 rounded-2xl bg-muted/20 border-none font-bold"><CalendarIcon className="mr-3 h-4 w-4 text-primary" />{field.value ? format(field.value, "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Selecione..."}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(d) => d < new Date()} initialFocus locale={ptBR} /></PopoverContent></Popover>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background via-background to-transparent pt-12 safe-bottom"><Button type="submit" className="w-full h-16 rounded-2xl font-black text-lg gradient-primary shadow-xl">Salvar Meta</Button></div>
            </form>
          </Form>
        </DrawerContent>
      </Drawer>
    </>
  );
}