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
  const partnerAvatar = profile?.partnerAvatar;
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
            <div className="absolute -bottom-2 -right-3 h-11 w-11 flex items-center justify-center drop-shadow-lg z-20">
              {/* Moldura de Coração Branca (Fundo Puro) */}
              <svg viewBox="0 0 24 24" className="w-full h-full absolute text-white fill-white">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              
              {/* Container da Foto com Recorte de Coração (Sem fundo laranja) */}
              <div 
                className="w-full h-full flex items-center justify-center p-[4px] relative bg-transparent"
                style={{ 
                  clipPath: 'path("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z")'
                }}
              >
                {partnerAvatar ? (
                  <img src={partnerAvatar} alt="Parceiro" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Heart className="h-4 w-4 text-muted-foreground fill-muted-foreground" />
                  </div>
                )}
              </div>
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