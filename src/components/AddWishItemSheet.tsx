"use client";

import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ListChecks, Link as LinkIcon, X } from 'lucide-react';
import { usePlanning } from '@/hooks/usePlanning';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { SuccessOverlay } from './SuccessOverlay';

const wishSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  price: z.string().refine(val => !isNaN(parseFloat(val.replace(/\./g, '').replace(',', '.'))), { message: 'Valor inválido' }),
  priority: z.enum(['high', 'medium', 'low']),
  link: z.string().url('Link inválido').optional().or(z.literal('')),
});

export function AddWishItemSheet() {
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addItem } = usePlanning();
  const form = useForm<z.infer<typeof wishSchema>>({ resolver: zodResolver(wishSchema), defaultValues: { name: '', price: '', priority: 'medium', link: '' } });

  const onSubmit = async (v: z.infer<typeof wishSchema>) => {
    try {
      await addItem.mutateAsync({ name: v.name, price: parseFloat(v.price.replace(/\./g, '').replace(',', '.')), priority: v.priority, link: v.link || null });
      setShowSuccess(true);
    } catch (e) { toast.error('Erro ao salvar.'); }
  };

  return (
    <>
      {showSuccess && <SuccessOverlay message="Adicionado!" onFinished={() => { setShowSuccess(false); setOpen(false); }} />}
      <Drawer open={open} onOpenChange={setOpen}>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-primary text-xs font-bold hover:opacity-80 transition-opacity"><Plus className="h-4 w-4" /> Adicionar</button>
        <DrawerContent className="h-[92vh] rounded-t-[2.5rem] bg-background border-none shadow-2xl">
          <DrawerHeader className="px-8 pt-4 pb-0 relative">
            <div className="mx-auto w-12 h-1 rounded-full bg-muted/40 mb-6" />
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-2xl font-black tracking-tighter flex items-center gap-2">Lista de Desejos <ListChecks className="h-5 w-5 text-primary" /></DrawerTitle>
              <DrawerClose asChild><button className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center"><X className="h-4 w-4" /></button></DrawerClose>
            </div>
          </DrawerHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-8 pt-8 pb-32 space-y-8">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">O que você quer comprar?</FormLabel>
                  <FormControl><Input placeholder="Ex: iPhone, Tênis..." className="h-14 rounded-2xl bg-muted/20 border-none font-bold" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Preço Estimado (R$)</FormLabel>
                  <FormControl><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span><Input placeholder="0,00" className="pl-10 h-14 rounded-2xl bg-muted/20 border-none font-black text-2xl" {...field} /></div></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Prioridade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-none px-5 font-bold"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                    <SelectContent className="rounded-2xl border-none shadow-2xl"><SelectItem value="high">Alta</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="low">Baixa</SelectItem></SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="link" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Link do Produto (Opcional)</FormLabel>
                  <FormControl><div className="relative"><LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="https://..." className="pl-11 h-14 rounded-2xl bg-muted/20 border-none" {...field} /></div></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background via-background to-transparent pt-12 safe-bottom"><Button type="submit" className="w-full h-16 rounded-2xl font-black text-lg gradient-primary shadow-xl">Salvar Item</Button></div>
            </form>
          </Form>
        </DrawerContent>
      </Drawer>
    </>
  );
}