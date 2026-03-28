"use client";

import React from 'react';

const Logo = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle 
      cx="46" 
      cy="56" 
      r="38" 
      stroke="currentColor" 
      strokeWidth="8" 
    />
    <path 
      d="M26 54L44 72L84 22" 
      stroke="currentColor" 
      strokeWidth="12" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#ff7a00] flex flex-col items-center justify-center overflow-hidden">
      <div className="animate-splash">
        <Logo className="h-24 w-24 text-white" />
      </div>
      <div className="mt-4 animate-pulse">
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Carregando...</p>
      </div>
    </div>
  );
}