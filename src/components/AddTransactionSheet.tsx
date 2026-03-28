"use client";

import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CalendarIcon, TrendingUp, TrendingDown, Loader2, Camera, Sparkles, X } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryIcon } from '@/types/finance';
import { useTransactions } from '@/hooks/useTransactions';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';
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

  const parseReceiptText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let detectedAmount: number | null = null;
    let detectedDate: Date | null = null;
    let detectedCategory = '';

    const moneyRegex = /(\d{1,3}(?:\.\d{3})*,\d{2})/;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].toUpperCase();
      if (line.includes('TROCO')) continue;
      
      const isTotalLine = line.includes('TOTAL') || line.includes('PAGAR') || line.includes('VALOR RECEBIDO') || line.includes('SUBTOTAL');
      
      if (isTotalLine) {
        if ((line.includes('ITENS') || line.includes('QTDE')) && !line.includes('VALOR')) continue;

        const match = line.match(moneyRegex);
        if (match) {
          const val = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
          if (val > 0 && val < 10000) {
            detectedAmount = val;
            break; 
          }
        }
      }
    }

    if (!detectedAmount) {
      const recentLines = lines.slice(-10);
      const candidates: number[] = [];
      recentLines.forEach(line => {
        const l = line.toUpperCase();
        if (l.includes('TROCO') || l.includes('ITENS')) return;
        const match = line.match(moneyRegex);
        if (match) candidates.push(parseFloat(match[1].replace(/\./g, '').replace(',', '.')));
      });
      if (candidates.length > 0) detectedAmount = Math.max(...candidates);
    }

    const dateRegex = /(\d{2})\/(\d{2})\/(\d{2,4})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      const year = dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3];
      const parsedDate = parse(`${dateMatch[1]}/${dateMatch[2]}/${year}`, 'dd/MM/yyyy', new Date());
      if (isValid(parsedDate)) detectedDate = parsedDate;
    }

    const keywordsMap: Record<string, string[]> = {
      food: ['habib', 'mcdonald', 'burger', 'restaurante', 'ifood', 'mercado', 'lanche', 'pizza', 'comida', 'padaria', 'esfiha', 'kibe', 'beirute'],
      transport: ['uber', '99app', 'posto', 'combustivel', 'gasolina', 'estacionamento', 'pedagio', 'shell', 'ipiranga'],
      leisure: ['cinema', 'show', 'teatro', 'bar', 'cerveja', 'clube'],
      health: ['farmacia', 'drogaria', 'hospital', 'clinica', 'medico', 'exame', 'raia', 'pacheco'],
      shopping: ['loja', 'vestuario', 'roupa', 'calcado', 'eletronico', 'amazon', 'mercadolivre', 'shopee'],
      bills: ['luz', 'agua', 'internet', 'celular', 'vivo', 'tim', 'claro', 'energia', 'sabesp']
    };

    const lowercaseText = text.toLowerCase();
    for (const [catId, words] of Object.entries(keywordsMap)) {
      if (words.some(word => lowercaseText.includes(word))) {
        detectedCategory = catId;
        break;
      }
    }

    return { amount: detectedAmount, date: detectedDate, category: detectedCategory };
  };

  const handleScanReceipt = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const toastId = toast.loading('Lendo rodapé da nota...');

    try {
      const { data: { text } } = await Tesseract.recognize(file, 'por', {
        logger: m => console.log("[OCR]", m.status, Math.round(m.progress * 100) + "%")
      });

      const parsedData = parseReceiptText(text);

      if (parsedData.amount !== null) {
        // Formatação direta para o campo de input (ex: 124,50)
        const formattedValue = parsedData.amount.toFixed(2).replace('.', ',');
        setAmount(formattedValue);
      }
      
      if (parsedData.category && categories.some(c => c.id === parsedData.category)) {
        setCategory(parsedData.category);
      }
      
      if (parsedData.date) {
        setDate(parsedData.date);
      }
      
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
      if (lines[0] && lines[0].length < 40) setDescription(lines[0]);

      toast.success('Total identificado!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Erro na leitura da nota.', { id: toastId });
    } finally {
      setIsScanning(false);
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
              Nova Movimentação <Sparkles className="h-4 w-4 text-primary animate-pulse" />
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

              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isScanning} 
                className="w-full h-16 border-2 border-dashed border-primary/30 text-primary bg-primary/5 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-primary/10 transition-colors"
              >
                {isScanning ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
                <span className="font-bold text-xs uppercase tracking-wider">
                  {isScanning ? 'Lendo nota...' : 'Escanear Nota'}
                </span>
              </Button>
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