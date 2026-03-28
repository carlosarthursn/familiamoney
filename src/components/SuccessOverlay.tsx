"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface SuccessOverlayProps {
  message?: string;
  onFinished?: () => void;
  className?: string;
}

export function SuccessOverlay({ message = "Concluído!", onFinished, className }: SuccessOverlayProps) {
  // Usamos um ref para garantir que o onFinished seja chamado apenas uma vez
  // e não dependamos da referência da função no array de dependências
  const onFinishedRef = React.useRef(onFinished);
  onFinishedRef.current = onFinished;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onFinishedRef.current) onFinishedRef.current();
    }, 2000);
    return () => clearTimeout(timer);
  }, []); // Executa apenas uma vez ao montar

  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in",
      className
    )}>
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
          <circle 
            cx="46" cy="56" r="38" 
            stroke="currentColor" 
            strokeWidth="8" 
            className="opacity-20"
            fill="none" 
          />
          <circle 
            cx="46" cy="56" r="38" 
            stroke="currentColor" 
            strokeWidth="8" 
            strokeLinecap="round"
            fill="none" 
            strokeDasharray="240"
            strokeDashoffset="240"
            className="animate-circle-fill"
            transform="rotate(-90 46 56)"
          />
          <path 
            d="M26 54L44 72L84 22" 
            stroke="currentColor" 
            strokeWidth="12" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none"
            strokeDasharray="100"
            strokeDashoffset="100"
            className="animate-check-draw"
          />
        </svg>
      </div>
      <p className="mt-6 text-lg font-bold text-foreground animate-slide-up">
        {message}
      </p>
    </div>
  );
}