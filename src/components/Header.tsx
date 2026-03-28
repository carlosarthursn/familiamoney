"use client";

import React from 'react';
import { Eye, EyeOff, HelpCircle, UserPlus, User, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

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
  const isLinked = !!profile?.linked_user_id;

  return (
    <header className="bg-primary text-primary-foreground px-6 safe-top shadow-lg relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
      
      {/* Top Action Bar */}
      <div className="flex justify-end pt-4 gap-1 relative z-10">
        <button 
          onClick={() => setShowBalance(!showBalance)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
        >
          {showBalance ? <Eye className="h-4.5 w-4.5" /> : <EyeOff className="h-4.5 w-4.5" />}
        </button>
        <button 
          onClick={onAnalysisClick}
          className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
        >
          <HelpCircle className="h-4.5 w-4.5" />
        </button>
        <button 
          onClick={onProfileClick}
          className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
        >
          <UserPlus className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Main Profile Area */}
      <div className="flex items-center gap-4 py-8 relative z-10">
        <div className="relative">
          <button 
            onClick={onProfileClick}
            className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all overflow-hidden border-2 border-white/40 shadow-md shrink-0 active:scale-95"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Perfil" className="h-full w-full object-cover" />
            ) : (
              <User className="h-8 w-8 text-white" />
            )}
          </button>
          {isLinked && (
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white flex items-center justify-center shadow-sm border border-primary/20">
              <Heart className="h-3.5 w-3.5 text-primary fill-primary" />
            </div>
          )}
        </div>
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold truncate">
              {isLinked ? 'Finanças em Família' : 'Bom ver você de novo'}
            </p>
          </div>
          <h1 className="text-xl font-bold tracking-tight truncate leading-tight">
            Olá, {displayName}
          </h1>
          {isLinked && (
            <p className="text-[9px] font-bold text-white/70 flex items-center gap-1 mt-0.5">
              Compartilhado com {profile?.partnerName}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}