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
            <div className="absolute -bottom-2 -right-3 h-12 w-12 drop-shadow-xl z-20">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <clipPath id="heartClip">
                    <path d="M50 88.7L43.9 83.1C22.2 63.4 8 50.5 8 34.8C8 22 18.1 12 30.9 12C38.1 12 45 15.4 50 20.7C55 15.4 61.9 12 69.1 12C81.9 12 92 22 92 34.8C92 50.5 77.8 63.4 56.1 83.1L50 88.7Z" />
                  </clipPath>
                </defs>
                
                {/* Moldura Branca externa */}
                <path 
                  d="M50 92L42.5 85.2C19.8 64.7 5 51.2 5 34.8C5 21.4 15.5 11 29 11C36.6 11 43.9 14.5 49.2 20.1C54.5 14.5 61.8 11 69.4 11C82.9 11 93.4 21.4 93.4 34.8C93.4 51.2 78.6 64.7 55.9 85.2L50 92Z" 
                  fill="white" 
                />
                
                {/* Imagem recortada */}
                <g clipPath="url(#heartClip)">
                  {partnerAvatar ? (
                    <image 
                      href={partnerAvatar} 
                      x="0" y="0" 
                      width="100" height="100" 
                      preserveAspectRatio="xMidYMid slice" 
                    />
                  ) : (
                    <rect width="100" height="100" fill="#e2e8f0" />
                  )}
                </g>
                
                {!partnerAvatar && (
                  <text 
                    x="50" y="55" 
                    textAnchor="middle" 
                    fontSize="20" 
                    fill="#94a3b8" 
                    className="font-bold"
                  >
                    ♥
                  </text>
                )}
              </svg>
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