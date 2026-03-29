"use client";

import { useState, useRef, useEffect } from 'react';
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
  
  // Lógica para o botão arrastável com posição inicial segura
  const [position, setPosition] = useState({ x: -100, y: -100 }); // Começa fora até o useEffect calcular
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addTransaction } = useTransactions();
  const { session } = useAuth();
  
  useEffect(() => {
    // Define posição inicial segura no mobile (canto inferior direito, acima da nav)
    const initialX = window.innerWidth - 75;
    const initialY = window.innerHeight - 140;
    setPosition({ x: initialX, y: initialY });
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y
    });
    setHasMoved(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const newX = e.touches[0].clientX - dragStart.x;
    const newY = e.touches[0].clientY - dragStart.y;
    
    // Limites para não sumir da tela
    const boundedX = Math.max(15, Math.min(window.innerWidth - 70, newX));
    const boundedY = Math.max(15, Math.min(window.innerHeight - 80, newY));
    
    setPosition({ x: boundedX, y: boundedY });
    setHasMoved(true);
    setIsDragging(true);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    if (hasMoved) {
      e.preventDefault();
      e.stopPropagation();
    } else {
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
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button 
            size="lg" 
            className={cn(
              "fixed h-14 w-14 rounded-full shadow-lg gradient-primary z-[60] touch-none",
              position.x === -100 && "invisible"
            )}
            style={{ 
              left: `${position.x}px`, 
              top: `${position.y}px`,
              position: 'fixed'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleButtonClick}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0 overflow-hidden bg-background">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle className="text-xl flex items-center gap-2">Nova Movimentação <Wand2 className="h-5 w-5 text-primary" /></SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-2xl">
              <button type="button" onClick={() => setType('expense')} className={cn("py-2.5 rounded-xl font-bold text-sm", type === 'expense' ? "bg-destructive text-white" : "text-muted-foreground")}>Despesa</button>
              <button type="button" onClick={() => setType('income')} className={cn("py-2.5 rounded-xl font-bold text-sm", type === 'income' ? "bg-success text-white" : "text-muted-foreground")}>Receita</button>
            </div>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full h-16 border-dashed border-primary/30 bg-primary/5 rounded-2xl flex flex-col gap-1">
              {isScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              <span className="text-[10px] font-black uppercase">Escanear Nota com IA</span>
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleScanReceipt} />
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase ml-1">Valor</Label>
              <Input type="text" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-14 text-2xl font-black rounded-2xl bg-muted/20 border-none" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat.icon);
                return (
                  <button key={cat.id} type="button" onClick={() => setCategory(cat.id)} className={cn("flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all h-20", category === cat.id ? "border-primary bg-primary/10 text-primary" : "border-transparent bg-muted/30")}>
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-bold">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-background pt-10 safe-bottom">
            <Button onClick={handleSubmit} disabled={addTransaction.isPending || isScanning} className={cn("w-full h-14 text-lg font-black rounded-2xl", type === 'income' ? "gradient-income" : "gradient-expense")}>Confirmar</Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}