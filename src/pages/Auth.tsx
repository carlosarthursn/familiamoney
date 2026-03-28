"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Mail, Lock, ArrowRight, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else if (error.message.includes('User already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      if (!isLogin) {
        toast.success('Conta criada com sucesso!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ff7a00] flex flex-col items-center justify-center px-6 safe-top safe-bottom relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-black/5 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Section */}
      <div className="mb-12 text-center animate-fade-in z-10">
        <div className="flex justify-center mb-2">
          <Check className="h-24 w-24 text-white stroke-[3px]" />
        </div>
        <h1 className="text-5xl font-extrabold text-white tracking-tighter mb-1">
          confere
        </h1>
        <p className="text-white/90 text-sm font-medium tracking-tight">
          seus gastos, do seu jeito
        </p>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-sm bg-white/95 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-2xl animate-slide-up z-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5 animate-slide-down">
              <Label htmlFor="name" className="text-muted-foreground text-[10px] uppercase font-bold ml-1">Nome</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ff7a00]" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Como quer ser chamado?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-12 h-12 rounded-2xl border-muted bg-muted/30 focus:bg-white transition-all"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-muted-foreground text-[10px] uppercase font-bold ml-1">Email</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ff7a00]" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-12 rounded-2xl border-muted bg-muted/30 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-muted-foreground text-[10px] uppercase font-bold ml-1">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ff7a00]" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-12 rounded-2xl border-muted bg-muted/30 focus:bg-white transition-all"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 font-bold text-lg rounded-2xl bg-[#ff7a00] hover:bg-[#ff8a20] text-white shadow-lg active:scale-95 transition-all mt-4"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="flex items-center justify-center">
                {isLogin ? 'Acessar Conta' : 'Criar Minha Conta'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </div>
            )}
          </Button>
        </form>

        {/* Toggle Account Action */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-[#ff7a00] transition-colors"
          >
            {isLogin ? (
              <>Ainda não tem conta? <span className="text-[#ff7a00] font-bold">Cadastre-se</span></>
            ) : (
              <>Já possui cadastro? <span className="text-[#ff7a00] font-bold">Faça login</span></>
            )}
          </button>
        </div>
      </div>
      
      {/* Footer Info */}
      <p className="mt-8 text-white/60 text-[10px] font-medium uppercase tracking-widest z-10">
        Seguro e Privado
      </p>
    </div>
  );
}