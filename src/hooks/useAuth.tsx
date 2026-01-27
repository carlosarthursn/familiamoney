"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'> & { name?: string; linked_user_id?: string };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { name?: string; linked_user_id?: string | null }) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    }
    
    // Fallback para o nome nos metadados
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const metadataName = currentUser?.user_metadata?.name;
    
    setProfile(data ? { ...data, name: data.name || metadataName } : { name: metadataName } as any);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Escuta mudanças de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Checa sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchProfile(currentUser.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (!error && data.user) {
      await supabase
        .from('profiles')
        .update({ name } as any)
        .eq('user_id', data.user.id);
    }

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      // Limpa estados e recarrega a página para garantir estado limpo
      setUser(null);
      setProfile(null);
      setSession(null);
      window.location.replace('/');
    }
  };

  const updateProfile = async (updates: { name?: string; linked_user_id?: string | null }) => {
    if (!user) return { error: new Error('Usuário não logado') };

    if (updates.name) {
      const { error: metaError } = await supabase.auth.updateUser({
        data: { name: updates.name }
      });
      if (metaError) return { error: metaError };
    }

    const { error: dbError } = await supabase
      .from('profiles')
      .update(updates as any)
      .eq('user_id', user.id);

    if (dbError && updates.linked_user_id) {
      return { error: new Error('Erro ao vincular. Verifique se a tabela profiles está configurada.') };
    }

    await refreshProfile();
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}