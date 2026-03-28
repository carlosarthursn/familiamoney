"use client";

import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CalendarIcon, TrendingUp, TrendingDown, Loader2, Camera, Sparkles, Wand2 } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryIcon } from '@/types/finance';
import { useTransactions } from '@/hooks/useTransactions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SuccessOverlay } from './SuccessOverlay';

export function AddTransactionSheet() {
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addTransaction } = useTransactions();
  
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  
  const resetForm = () => {
    setType('expense');
    setAmount('');
    setCategory('');
    setDate(new Date());
    setDescription('');
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl.split(',')[1]);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleScanReceipt = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const toastId = toast.loading('IA processando imagem...');

    try {
      const imageBase64 = await compressImage(file);
      const { data: { session } } = await supabase.auth.getSession();

      // Chamada direta via fetch para evitar problemas de proxy do invoke
      const response = await fetch('https://vipigovrygzyjaibssra.supabase.co/functions/v1/scan-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcGlnb3ZyeWd6eWphaWJzc3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzgzNTMsImV4cCI6MjA4NTA1NDM1M30.Z5hyETn-WMuagY6yiBlyFWTahUm7SSWl4j-m1uI4x9U'
        },
        body: JSON.stringify({ imageBase64 })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na resposta do servidor');
      }

      const data = await response.json();

      if (data) {
        if (data.valor) setAmount(data.valor.toFixed(2).replace('.', ','));
        if (data.categoria) setCategory(data.categoria);
        if (data.descricao) setDescription(data.descricao);
        if (data.data) {
          const parsedDate = parseISO(data.data);
          if (isValid(parsedDate)) setDate(parsedDate);
        }
        toast.success('Nota lida com sucesso!', { id: toastId });
      }
    } catch (error: any) {
      console.error("[IA Scan Error]", error);
      toast.error(error.message || 'Erro ao processar imagem.', { id: toastId });
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!amount || !category) {
      toast.error('Preencha o valor e a categoria');
      return;
    }
    
    const cleanAmount = amount.replace(/\./g, '').replace(',', '.');
    const numAmount = parseFloat(cleanAmount);
    
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
      
      setShowSuccess(true);
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar movimentação.');
    }
  };
  
  return (
    <>
      {showSuccess && (
        <SuccessOverlay 
          message="Movimentação salva!" 
          onFinished={() => {
            setShowSuccess(false);
            setOpen(false);
          }} 
        />
      )}
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button size="lg" className="fixed bottom-28 right-6 h-14 w-14 rounded-full shadow-lg gradient-primary z-50">
            <Plus className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl flex flex-col p-0 overflow-hidden bg-background">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle className="text-xl flex items-center gap-2">
              Nova Movimentação <Wand2 className="h-5 w-5 text-primary animate-pulse" />
            </SheetTitle>
            <SheetDescription className="sr-only">Adicione uma nova transação.</SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-6 pb-24">
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-2xl">
                <button 
                  type="button" 
                  onClick={() => { setType('expense'); setCategory(''); }} 
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all", 
                    type === 'expense' ? "bg-destructive text-white shadow-sm scale-[1.02]" : "text-muted-foreground"
                  )}
                >
                  <TrendingDown className="h-4 w-4" /> Despesa
                </button>
                <button 
                  type="button" 
                  onClick={() => { setType('income'); setCategory(''); }} 
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all", 
                    type === 'income' ? "bg-success text-white shadow-sm scale-[1.02]" : "text-muted-foreground"
                  )}
                >
                  <TrendingUp className="h-4 w-4" /> Receita
                </button>
              </div>

              <div className="relative">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isScanning} 
                  className="w-full h-20 border-2 border-dashed border-primary/30 text-primary bg-primary/5 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-primary/10 transition-all hover:border-primary active:scale-95"
                >
                  {isScanning ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6" />
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs uppercase tracking-widest">
                      {isScanning ? 'Lendo com IA...' : 'Escanear Nota com IA'}
                    </span>
                    {!isScanning && <Sparkles className="h-3 w-3 fill-primary" />}
                  </div>
                </Button>
                {isScanning && (
                  <div className="absolute inset-0 rounded-2xl bg-white/10 backdrop-blur-[1px] pointer-events-none" />
                )}
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment" 
                onChange={handleScanReceipt} 
              />
              
              <div className="space-y-2">
                <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest px-1">Valor</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">R$</span>
                  <Input 
                    type="text" 
                    inputMode="decimal" 
                    placeholder="0,00" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    className="pl-12 h-14 text-2xl font-black rounded-2xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest px-1">Categoria</Label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => {
                    const Icon = getCategoryIcon(cat.icon);
                    const isSelected = category === cat.id;
                    return (
                      <button 
                        key={cat.id} 
                        type="button" 
                        onClick={() => setCategory(cat.id)} 
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all h-20", 
                          isSelected 
                            ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 scale-[1.05]" 
                            : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/60"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-[10px] font-bold truncate w-full text-center">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest px-1">Data</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-12 text-sm rounded-2xl bg-muted/30 border-none px-4 font-bold">
                      <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                      {format(date, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-xl" align="start">
                    <Calendar 
                      mode="single" 
                      selected={date} 
                      onSelect={(d) => { if (d) setDate(d); setDatePickerOpen(false); }} 
                      initialFocus 
                      locale={ptBR} 
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest px-1">Descrição</Label>
                <Textarea 
                  placeholder="Ex: Almoço de Domingo" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="min-h-[80px] text-sm rounded-2xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 p-4 resize-none" 
                />
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-10 safe-bottom">
            <Button 
              onClick={handleSubmit} 
              disabled={addTransaction.isPending || isScanning} 
              className={cn(
                "w-full h-14 text-lg font-black rounded-2xl shadow-lg transition-transform active:scale-95", 
                type === 'income' ? "gradient-income" : "gradient-expense"
              )}
            >
              {addTransaction.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Salvando...</span>
                </div>
              ) : 'Confirmar'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}