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
    <header className="bg-primary text-primary-foreground pt-10 pb-6 px-6 safe-top shadow-lg">
      <div className="flex items-center justify-between mb-5">
        {/* Profile Button with Photo Support */}
        <button 
          onClick={onProfileClick}
          className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all overflow-hidden border-2 border-white/30 shadow-md active:scale-95"
          aria-label="Perfil"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Perfil" className="h-full w-full object-cover" />
          ) : (
            <User className="h-6 w-6 text-white" />
          )}
        </button>

        {/* Action Icons */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowBalance(!showBalance)}
            className="p-2.5 hover:bg-white/10 rounded-full transition-colors active:scale-90"
            aria-label={showBalance ? "Esconder saldo" : "Mostrar saldo"}
          >
            {showBalance ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </button>
          <button 
            onClick={onAnalysisClick}
            className="p-2.5 hover:bg-white/10 rounded-full transition-colors active:scale-90"
            aria-label="Análise"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <button 
            onClick={onProfileClick}
            className="p-2.5 hover:bg-white/10 rounded-full transition-colors active:scale-90"
            aria-label="Compartilhar conta"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="animate-fade-in">
        <h1 className="text-lg font-bold tracking-tight">
          Olá, {displayName}
        </h1>
        <p className="text-[10px] opacity-70 uppercase tracking-widest font-medium">Bom ver você de novo</p>
      </div>
    </header>
  );
}