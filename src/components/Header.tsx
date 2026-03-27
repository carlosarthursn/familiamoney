"use client";

import React, { useState } from 'react';
import { Eye, EyeOff, HelpCircle, UserPlus, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  displayName: string;
  onProfileClick?: () => void;
}

export function Header({ displayName, onProfileClick }: HeaderProps) {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <header className="bg-primary text-primary-foreground pt-8 pb-6 px-6 safe-top">
      <div className="flex items-center justify-between mb-8">
        {/* Avatar/Profile Icon */}
        <button 
          onClick={onProfileClick}
          className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <User className="h-6 w-6 text-white" />
        </button>

        {/* Action Icons */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowBalance(!showBalance)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            {showBalance ? <Eye className="h-6 w-6" /> : <EyeOff className="h-6 w-6" />}
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <HelpCircle className="h-6 w-6" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <UserPlus className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold tracking-tight">
          Olá, {displayName}
        </h1>
      </div>
    </header>
  );
}