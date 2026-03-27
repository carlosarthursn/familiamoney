import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CalendarIcon, Check, TrendingUp, TrendingDown, Loader2, Camera, Sparkles } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryIcon } from '@/types/finance';
import { useTransactions } from '@/hooks/useTransactions';
import { toast } from 'sonner';
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyCBVoAh31lqQN5NYngNIV5k27s2QUbPkD8";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export function AddTransactionSheet() {
  const [open, setOpen] = useState(false);
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

  const fileToGenerativePart = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        resolve({
          inlineData: { data: base64Data, mimeType: file.type },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  const handleScanReceipt = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const toastId = toast.loading('Lendo com Gemini 1.5 Flash...');

    try {
      // Tentando o modelo com prefixo completo para evitar o erro 404
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const imagePart = await fileToGenerativePart(file);
      
      const allowedCategories = categories.map(c => c.id).join(', ');
      const prompt = `Extraia dados desta nota/comprovante. 
      Retorne APENAS um JSON: {"amount": 0.00, "category": "id", "date": "YYYY-MM-DD", "description": "nome"}.
      Categorias válidas: ${allowedCategories}. Use 'other' se não identificar.`;

      const result = await model.generateContent([prompt, imagePart as any]);
      const response = await result.response;
      const text = response.text().replace(/```json|```/g, "").trim();
      const data = JSON.parse(text);

      if (data.amount) {
        const val = typeof data.amount === 'string' ? parseFloat(data.amount.replace(',', '.')) : data.amount;
        if (!isNaN(val)) setAmount(val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
      }
      if (data.category) {
        const exists = categories.some(c => c.id === data.category);
        setCategory(exists ? data.category : 'other');
      }
      if (data.description) setDescription(data.description);
      if (data.date) {
        const parsedDate = parseISO(data.date);
        if (isValid(parsedDate)) setDate(parsedDate);
      }

      toast.success('Leitura concluída com Gemini 1.5 Flash!', { id: toastId });
    } catch (error: any) {
      console.error('ERRO IA:', error);
      let userMessage = 'Falha técnica ao acessar o Gemini 1.5 Flash.';
      if (error.message?.includes('404')) {
        userMessage = 'Erro 404: Verifique se a API "Generative Language API" está ativada no seu Google Cloud Console.';
      }
      toast.error(userMessage, { id: toastId, duration: 6000 });
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
    
    const numAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
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
      
      toast.success('Salvo com sucesso!');
      resetForm();
      setOpen(false);
    } catch (error: any) {
      toast.error('Erro ao salvar no banco de dados.');
    }
  };
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          size="lg" 
          className="fixed bottom-28 right-6 h-14 w-14 rounded-full shadow-lg gradient-primary hover:opacity-90 z-50"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="text-xl flex items-center gap-2">
            Nova Movimentação
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          </SheetTitle>
          <SheetDescription className="sr-only">
            Adicione detalhes sobre sua nova receita ou despesa.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-6 pb-24">
          <div className="space-y-5 py-2">
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
                    ? "bg-destructive text-white shadow-sm" 
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
                    ? "bg-success text-white shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <TrendingUp className="h-4 w-4" />
                Receita
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="w-full h-14 border-2 border-dashed border-primary/40 text-primary hover:bg-primary/5 rounded-xl flex flex-col items-center justify-center gap-0"
            >
              {isScanning ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    <span className="font-bold">Escanear com I.A.</span>
                  </div>
                  <span className="text-[10px] opacity-70">Valor, data e categoria automáticos</span>
                </>
              )}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleScanReceipt}
            />
            
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
            
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Descrição / Estabelecimento</Label>
              <Textarea
                placeholder="Ex: Almoço no Restaurante X"
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
            disabled={addTransaction.isPending || isScanning}
            className={cn(
              "w-full h-12 text-base font-semibold rounded-xl shadow-lg text-white",
              type === 'income' ? "gradient-income" : "gradient-expense"
            )}
          >
            {addTransaction.isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </div>
            ) : 'Confirmar e Salvar'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}