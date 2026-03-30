"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, ArrowRight, Loader2, User, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(100, 'Senha muito longa'),
  name: z.string().min(2, 'Nome muito curto').max(50, 'Nome muito longo').optional(),
});

const Logo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="46" cy="56" r="38" stroke="currentColor" strokeWidth="8" />
    <path d="M26 54L44 72L84 22" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBiometrySupported, setIsBiometrySupported] = useState(false);
  
  const { signIn, signUp, signInWithPasskey } = useAuth();

  useEffect(() => {
    setIsBiometrySupported(!!window.PublicKeyCredential);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = authSchema.safeParse({ email, password, name: isLogin ? undefined : name });
    if (!validation.success) return toast.error(validation.error.errors[0].message);
    
    setLoading(true);
    
    // Trava de Segurança: Destrava o botão em 8s caso o banco de dados trave
    const timeoutId = setTimeout(() => setLoading(false), 8000);

    try {
      if (isLogin) {
        const { error } = await (signIn(email, password) as any);
        if (error) {
          clearTimeout(timeoutId);
          toast.error(error.message.includes('Invalid login credentials') ? 'Email ou senha incorretos' : error.message);
          setLoading(false);
        }
      } else {
        const { data, error } = await (signUp(email, password, name) as any);
        if (error) {
          clearTimeout(timeoutId);
          toast.error(error.message);
          setLoading(false);
        } else if (data?.user && !data?.session) {
          clearTimeout(timeoutId);
          toast.success('Conta criada! Verifique seu e-mail para confirmar o acesso.');
          setLoading(false);
          setIsLogin(true);
        } else {
          toast.success('Bem-vindo!');
        }
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      toast.error('Ocorreu um erro inesperado.');
      setLoading(false);
    }
  };

  const handleBiometryLogin = async () => {
    setLoading(true);
    const timeoutId = setTimeout(() => setLoading(false), 8000);
    
    try {
      const { error } = await signInWithPasskey();
      if (error) throw error;
      toast.success('Bem-vindo!');
    } catch (err: any) {
      clearTimeout(timeoutId);
      toast.error('Nenhuma biometria cadastrada para este dispositivo ou cancelado.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ff7a00] flex flex-col items-center justify-center px-8 relative overflow-hidden">
      <div className="mb-12 text-center animate-fade-in z-10">
        <div className="flex justify-center mb-6"><Logo className="h-20 w-20 text-white" /></div>
        <h1 className="text-4xl font-bold text-white tracking-tighter mb-1">confere</h1>
        <p className="text-white/60 text-xs font-medium tracking-wide">seus gastos, do seu jeito</p>
      </div>

      <div className="w-full max-w-[300px] z-10">
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div className="relative animate-slide-down">
              <User className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input type="text" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} className="bg-transparent border-0 border-b border-white/20 rounded-none h-10 pl-7 text-white placeholder:text-white/30 focus-visible:ring-0 transition-all" />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-transparent border-0 border-b border-white/20 rounded-none h-10 pl-7 text-white placeholder:text-white/30 focus-visible:ring-0 transition-all" />
          </div>
          <div className="relative">
            <Lock className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-transparent border-0 border-b border-white/20 rounded-none h-10 pl-7 text-white placeholder:text-white/30 focus-visible:ring-0 transition-all" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 font-semibold rounded-full bg-white text-[#ff7a00] hover:bg-white/90 active:scale-95 transition-all mt-6 shadow-none">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center">{isLogin ? 'Entrar' : 'Criar Conta'} <ArrowRight className="ml-2 h-4 w-4" /></span>}
          </Button>
        </form>

        {isLogin && isBiometrySupported && (
          <button onClick={handleBiometryLogin} disabled={loading} className="w-full mt-4 flex items-center justify-center gap-2 text-white/70 hover:text-white text-xs font-medium transition-colors py-2">
            <Fingerprint className="h-4 w-4" /> Entrar com Biometria
          </button>
        )}

        <div className="mt-8 text-center">
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-[11px] text-white/50 hover:text-white transition-colors">
            {isLogin ? 'Não tem conta? Criar agora' : 'Já tem conta? Fazer login'}
          </button>
        </div>
      </div>
      <div className="absolute bottom-10 text-white/20 text-[9px] font-bold uppercase tracking-[0.2em]">Private & Secure</div>
    </div>
  );
}