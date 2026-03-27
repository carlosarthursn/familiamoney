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
    <header className="bg-primary text-primary-foreground px-6 safe-top shadow-lg relative overflow-hidden">
      {/* Top Action Bar - Ícones menores no topo direito */}
      <div className="flex justify-end pt-4 gap-1">
        <button 
          onClick={() => setShowBalance(!showBalance)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
          aria-label={showBalance ? "Esconder saldo" : "Mostrar saldo"}
        >
          {showBalance ? <Eye className="h-4.5 w-4.5" /> : <EyeOff className="h-4.5 w-4.5" />}
        </button>
        <button 
          onClick={onAnalysisClick}
          className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
          aria-label="Análise"
        >
          <HelpCircle className="h-4.5 w-4.5" />
        </button>
        <button 
          onClick={onProfileClick}
          className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
          aria-label="Compartilhar conta"
        >
          <UserPlus className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Main Profile Area - Centralizada verticalmente no espaço restante */}
      <div className="flex items-center gap-4 py-8">
        <button 
          onClick={onProfileClick}
          className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all overflow-hidden border-2 border-white/40 shadow-md shrink-0 active:scale-95"
          aria-label="Perfil"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Perfil" className="h-full w-full object-cover" />
          ) : (
            <User className="h-8 w-8 text-white" />
          )}
        </button>
        
        <div className="flex flex-col min-w-0">
          <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold truncate">
            Bom ver você de novo
          </p>
          <h1 className="text-xl font-bold tracking-tight truncate leading-tight">
            Olá, {displayName}
          </h1>
        </div>
      </div>
    </header>
  );
}