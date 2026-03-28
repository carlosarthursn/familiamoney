"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Mail, Lock, ArrowRight, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(100, 'Senha muito longa'),
  name: z.string().min(2, 'Nome muito curto').max(50, 'Nome muito longo').optional(),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = authSchema.safeParse({ email, password, name: isLogin ? undefined : name });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password, name);
      
      if (error) {
        toast.error(error.message.includes('Invalid login credentials') ? 'Email ou senha incorretos' : error.message);
        return;
      }
      
      if (!isLogin) toast.success('Bem-vindo ao confere!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ff7a00] flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Brand Section - Super Clean */}
      <div className="mb-12 text-center animate-fade-in z-10">
        <div className="flex justify-center mb-4">
          <Check className="h-16 w-16 text-white stroke-[2.5px]" />
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tighter mb-1">
          confere
        </h1>
        <p className="text-white/60 text-xs font-medium tracking-wide">
          seus gastos, do seu jeito
        </p>
      </div>

      {/* Discrete Form Area */}
      <div className="w-full max-w-[300px] z-10">
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div className="relative animate-slide-down">
              <User className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                type="text"
                placeholder="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent border-0 border-b border-white/20 rounded-none h-10 pl-7 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white transition-all"
                required={!isLogin}
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border-0 border-b border-white/20 rounded-none h-10 pl-7 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white transition-all"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent border-0 border-b border-white/20 rounded-none h-10 pl-7 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white transition-all"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 font-semibold rounded-full bg-white text-[#ff7a00] hover:bg-white/90 active:scale-95 transition-all mt-6 shadow-none"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center">
                {isLogin ? 'Entrar' : 'Começar'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-[11px] text-white/50 hover:text-white transition-colors tracking-tight"
          >
            {isLogin ? 'Não tem conta? Criar agora' : 'Já tem conta? Fazer login'}
          </button>
        </div>
      </div>
      
      {/* Small Legal/Safe badge */}
      <div className="absolute bottom-10 text-white/20 text-[9px] font-bold uppercase tracking-[0.2em]">
        Private & Secure
      </div>
    </div>
  );
}