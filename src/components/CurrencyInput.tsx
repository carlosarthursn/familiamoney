"use client";

import { useState, useEffect } from 'react';
import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function formatCurrencyDisplay(raw: string) {
  if (!raw) return '0,00';
  const padded = raw.padStart(3, '0');
  const integerPart = padded.slice(0, -2);
  const decimalPart = padded.slice(-2);
  const formattedInteger = parseInt(integerPart, 10).toLocaleString('pt-BR');
  return `${formattedInteger},${decimalPart}`;
}

interface CurrencyInputProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  autoFocus?: boolean;
}

export function CurrencyInput({ value, onChange, className, autoFocus }: CurrencyInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (autoFocus) setIsOpen(true);
  }, [autoFocus]);

  const handleKey = (key: string) => {
    if (value.length >= 10) return; // Limite de dígitos
    if (value === '' && key === '0') return; // Evita começar com zero
    onChange(value + key);
  };
  
  const handleBackspace = () => onChange(value.slice(0, -1));
  const handleClear = () => onChange('');

  // Previne rolagem do fundo quando teclado aberto
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      <div 
        className={cn(
          "relative rounded-2xl bg-muted/20 flex items-center px-4 cursor-pointer transition-all border border-transparent h-14 text-xl", 
          isOpen && "border-primary bg-primary/5 ring-2 ring-primary/20", 
          className
        )}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }}
      >
        <span className="text-muted-foreground font-bold mr-1 text-[0.8em]">R$</span>
        <span className={cn("font-black", value ? "text-foreground" : "text-muted-foreground/40")}>
          {formatCurrencyDisplay(value)}
        </span>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex flex-col justify-end">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); }} />
          
          <div className="relative bg-background border-t border-border shadow-2xl p-4 pb-8 animate-in slide-in-from-bottom-full duration-300 rounded-t-[2.5rem]">
            <div className="flex justify-between items-center mb-6 px-2 pt-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Valor digitado</span>
                <div className="text-3xl font-black text-primary">R$ {formatCurrencyDisplay(value)}</div>
              </div>
              <Button type="button" size="lg" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); }} className="rounded-2xl font-black h-14 px-8 shadow-md">
                OK
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleKey(num.toString()); }}
                  className="h-16 bg-muted/40 hover:bg-muted active:bg-muted/60 rounded-2xl text-2xl font-bold transition-colors shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClear(); }}
                className="h-16 bg-muted/40 hover:bg-muted active:bg-muted/60 rounded-2xl text-xl font-bold text-destructive transition-colors shadow-sm"
              >
                C
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleKey('0'); }}
                className="h-16 bg-muted/40 hover:bg-muted active:bg-muted/60 rounded-2xl text-2xl font-bold transition-colors shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBackspace(); }}
                className="h-16 bg-muted/40 hover:bg-muted active:bg-muted/60 rounded-2xl flex items-center justify-center transition-colors text-muted-foreground shadow-sm"
              >
                <Delete className="h-7 w-7" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}