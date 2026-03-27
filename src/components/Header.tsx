"use client";

import React from 'react';
import { Eye, EyeOff, HelpCircle, UserPlus, User } from 'lucide-react';

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
  return (
    <header className="bg-primary text-primary-foreground pt-4 pb-6 px-6 safe-top">
      <div className="flex items-center justify-between mb-5">
        {/* Profile Button */}
        <button 
          onClick={onProfileClick}
          className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          aria-label="Perfil"
        >
          <User className="h-5 w-5 text-white" />
        </button>

        {/* Action Icons */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowBalance(!showBalance)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label={showBalance ? "Esconder saldo" : "Mostrar saldo"}
          >
            {showBalance ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </button>
          <button 
            onClick={onAnalysisClick}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Análise"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <button 
            onClick={onProfileClick}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Compartilhar conta"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Welcome Message - Subtle and clean */}
      <div className="animate-fade-in">
        <h1 className="text-base font-medium opacity-90">
          Olá, {displayName}
        </h1>
      </div>
    </header>
  );
}