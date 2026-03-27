"use client";

import React from 'react';
import { Eye, EyeOff, HelpCircle, UserPlus, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  displayName: string;
  showBalance: boolean;
  setShowBalance: (show: boolean) => void;
  onProfileClick?: () => void;
  onAnalysisClick?: () => void;
}

export function Header({ 
  displayName, 
  showBalance, 
  setShowBalance, 
  onProfileClick,
  onAnalysisClick 
}: HeaderProps) {
  const { profile } = useAuth();
  const avatarUrl = profile?.avatar_url;

  return (
    <header className="bg-primary text-primary-foreground px-6 safe-top shadow-lg">
      {/* Container com altura mínima e paddings equilibrados para centralização vertical real */}
      <div className="flex items-center justify-between min-h-[140px] pt-10 pb-10">
        
        {/* Lado Esquerdo: Perfil e Texto */}
        <div className="flex items-center gap-3 overflow-hidden">
          <button 
            onClick={onProfileClick}
            className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all overflow-hidden border-2 border-white/40 shadow-md shrink-0 active:scale-95"
            aria-label="Perfil"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Perfil" className="h-full w-full object-cover" />
            ) : (
              <User className="h-7 w-7 text-white" />
            )}
          </button>
          
          <div className="flex flex-col min-w-0">
            <h1 className="text-base font-bold tracking-tight truncate leading-tight">
              Olá, {displayName}
            </h1>
            <p className="text-[10px] opacity-90 uppercase tracking-widest font-bold truncate">
              Bom ver você de novo
            </p>
          </div>
        </div>

        {/* Lado Direito: Ícones de Ação */}
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={() => setShowBalance(!showBalance)}
            className="p-2.5 hover:bg-white/10 rounded-full transition-colors active:scale-90"
            aria-label={showBalance ? "Esconder saldo" : "Mostrar saldo"}
          >
            {showBalance ? <Eye className="h-6 w-6" /> : <EyeOff className="h-6 w-6" />}
          </button>
          <button 
            onClick={onAnalysisClick}
            className="p-2.5 hover:bg-white/10 rounded-full transition-colors active:scale-90"
            aria-label="Análise"
          >
            <HelpCircle className="h-6 w-6" />
          </button>
          <button 
            onClick={onProfileClick}
            className="p-2.5 hover:bg-white/10 rounded-full transition-colors active:scale-90"
            aria-label="Compartilhar conta"
          >
            <UserPlus className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}