"use client";

import { useState, useRef, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CalendarIcon, TrendingUp, TrendingDown, Loader2, Camera, Sparkles, Wand2, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryIcon } from '@/types/finance';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
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
  
  // Lógica para o botão arrastável
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addTransaction } = useTransactions();
  const { session } = useAuth();
  
  useEffect(() => {
    // Posição inicial segura
    const initialX = window.innerWidth - 80;
    const initialY = window.innerHeight - 140;
    setPosition({ x: initialX, y: initialY });
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStart.current = {
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y
    };
    hasMoved.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const newX = e.touches[0].clientX - dragStart.current.x;
    const newY = e.touches[0].clientY - dragStart.current.y;
    
    // Limites da tela para o botão não sumir
    const boundedX = Math.max(10, Math.min(window.innerWidth - 65, newX));
    const boundedY = Math.max(10, Math.min(window.innerHeight - 80, newY));
    
    if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) {
      hasMoved.current = true;
    }
    
    setPosition({ x: boundedX, y: boundedY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleButtonClick = () => {
    if (!hasMoved.current) {
      setOpen(true);
    }
  };

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
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
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
    const toastId = toast.loading('Analisando nota...');

    try {
      const imageBase64 = await compressImage(file);
      const response = await fetch("https://vipigovrygzyjaibssra.supabase.co/functions/v1/scan-receipt", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcGlnb3ZyeWd6eWphaWJzc3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzgzNTMsImV4cCI6MjA4NTA1NDM1M30.Z5hyETn-WMuagY6yiBlyFWTahUm7SSWl4j-m1uI4x9U'
        },
        body: JSON.stringify({ imageBase64 })
      });

      if (!response.ok) throw new Error('Erro ao processar imagem');
      const data = await response.json();
      if (data) {
        if (data.valor) setAmount(Number(data.valor).toFixed(2).replace('.', ','));
        if (data.categoria) setCategory(data.categoria);
        if (data.descricao) setDescription(data.descricao);
        toast.success('Leitura concluída!', { id: toastId });
      }
    } catch (error: any) {
      toast.error('Falha ao ler nota.', { id: toastId });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !category) return toast.error('Preencha os campos obrigatórios');
    const numAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    try {
      await addTransaction.mutateAsync({
        type, amount: numAmount, category,
        date: format(date, 'yyyy-MM-dd'),
        description: description || undefined,
      });
      setShowSuccess(true);
      resetForm();
    } catch (error) { toast.error('Erro ao salvar.'); }
  };
  
  return (
    <>
      {showSuccess && <SuccessOverlay message="Salvo!" onFinished={() => { setShowSuccess(false); setOpen(false); }} />}
      
      {/* Botão Flutuante Draggable */}
      <Button 
        size="lg" 
        className={cn(
          "fixed h-14 w-14 rounded-full shadow-lg gradient-primary z-[60] touch-none transition-transform active:scale-110",
          position.x === -100 && "invisible"
        )}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleButtonClick}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="h-[90vh] rounded-t-3xl bg-background border-none outline-none">
          <DrawerHeader className="px-6 pt-4 pb-0 relative">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-4" />
            <DrawerTitle className="text-xl flex items-center gap-2">
              Nova Movimentação <Wand2 className="h-5 w-5 text-primary" />
            </DrawerTitle>
            <DrawerDescription className="sr-only">Formulário de nova transação</DrawerDescription>
            <DrawerClose asChild>
              <button className="absolute right-6 top-6 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </DrawerClose>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-6 pt-6">
            {/* Seletor de Tipo */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-2xl">
              <button 
                type="button" 
                onClick={() => { setType('expense'); setCategory(''); }} 
                className={cn(
                  "py-2.5 rounded-xl font-bold text-sm transition-all", 
                  type === 'expense' ? "bg-destructive text-white shadow-sm" : "text-muted-foreground"
                )}
              >
                Despesa
              </button>
              <button 
                type="button" 
                onClick={() => { setType('income'); setCategory(''); }} 
                className={cn(
                  "py-2.5 rounded-xl font-bold text-sm transition-all", 
                  type === 'income' ? "bg-success text-white shadow-sm" : "text-muted-foreground"
                )}
              >
                Receita
              </button>
            </div>

            {/* Escanear com IA */}
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isScanning}
              className="w-full h-16 border-dashed border-primary/30 bg-primary/5 rounded-2xl flex flex-col gap-1 active:scale-95 transition-transform"
            >
              {isScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              <span className="text-[10px] font-black uppercase tracking-widest">Escanear Nota com IA</span>
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleScanReceipt} />

            {/* Valor */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase ml-1 tracking-widest text-muted-foreground">Valor</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">R$</span>
                <Input 
                  type="text" 
                  inputMode="decimal" 
                  placeholder="0,00" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  className="h-14 text-2xl font-black rounded-2xl bg-muted/20 border-none pl-12 focus-visible:ring-1 focus-visible:ring-primary/20" 
                />
              </div>
            </div>

            {/* Categorias */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase ml-1 tracking-widest text-muted-foreground">Categoria</Label>
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
                          ? "border-primary bg-primary/10 text-primary shadow-sm scale-105" 
                          : "border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] font-bold truncate w-full text-center">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Data */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase ml-1 tracking-widest text-muted-foreground">Data</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12 text-sm rounded-2xl bg-muted/20 border-none px-4 font-bold"
                  >
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

            {/* Descrição */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase ml-1 tracking-widest text-muted-foreground">Descrição</Label>
              <Textarea 
                placeholder="Ex: Mercado mensal, Netflix..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-2xl bg-muted/20 border-none min-h-[100px] p-4 text-sm focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-10 safe-bottom z-10">
            <Button 
              onClick={handleSubmit} 
              disabled={addTransaction.isPending || isScanning} 
              className={cn(
                "w-full h-14 text-lg font-black rounded-2xl shadow-lg active:scale-95 transition-transform", 
                type === 'income' ? "gradient-income" : "gradient-expense"
              )}
            >
              {addTransaction.isPending ? 'Salvando...' : 'Confirmar'}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}