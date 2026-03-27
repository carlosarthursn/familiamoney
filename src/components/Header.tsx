"use client";

import React from 'react';
import { Eye, EyeOff, HelpCircle, UserPlus, User } from 'lucide-react';

interface HeaderProps {
  displayName: string;
  showBalance: boolean;
  setShowBalance: (show: boolean) => void;
  onProfileClick?: () => void;
}

export function Header({ displayName, showBalance, setShowBalance, onProfileClick }: HeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground pt-6 pb-8 px-6 safe-top">
      <div className="flex items-center justify-between mb-6">
        {/* Profile Button */}
        <button 
          onClick={onProfileClick}
          className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          aria-label="Perfil"
        >
          <User className="h-5 w-5 text-white" />
        </button>

        {/* Action Icons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowBalance(!showBalance)}
            className="p-2.5 hover:bg-white/10 rounded-full transition-colors"
            aria-label={showBalance ? "Esconder saldo" : "Mostrar saldo"}
          >
            {showBalance ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </button>
          <button 
            className="p-2.5 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Ajuda"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <button 
            className="p-2.5 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Convidar"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Welcome Message - More subtle bold */}
      <div className="animate-fade-in">
        <h1 className="text-lg font-medium tracking-tight opacity-95">
          Olá, {displayName}
        </h1>
      </div>
    </header>
  );
}