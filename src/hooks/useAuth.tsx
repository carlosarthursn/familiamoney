import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  name?: string;
  linked_user_id?: string | null;
  partnerName?: string | null;
  monthly_budget?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { name?: string; linked_user_id?: string | null; monthly_budget?: number }) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (currentUser: User) => {
    try {
      // Tenta buscar o perfil do usuário atual
      const { data: dbProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();
      
      if (fetchError) {
        console.error("Erro ao buscar perfil:", fetchError);
        return;
      }

      if (dbProfile) {
        const profileData = dbProfile as any;
        let pName: string | null = null;

        // Se houver um parceiro vinculado, tenta buscar o nome dele
        if (profileData.linked_user_id) {
          const { data: partner } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', profileData.linked_user_id)
            .maybeSingle();
          if (partner) {
            pName = (partner as any).name || (partner as any).email?.split('@')[0];
          }
        }

        setProfile({
          name: profileData.name || currentUser.email?.split('@')[0] || 'Usuário',
          linked_user_id: profileData.linked_user_id,
          partnerName: pName,
          monthly_budget: Number(profileData.monthly_budget) || 0
        });
      } else {
        // Criação automática de perfil caso não exista
        const newProfile = {
          id: currentUser.id,
          user_id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário',
          monthly_budget: 0
        };

        await supabase.from('profiles').insert(newProfile);
        setProfile({ name: newProfile.name, monthly_budget: 0 });
      }
    } catch (e) {
      console.error("Auth: Falha crítica ao carregar perfil:", e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchProfile(currentSession.user);
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);
      
      if (newUser) {
        await fetchProfile(newUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, name: string) => {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
  };

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.replace('/');
  };

  const updateProfile = async (updates: any) => {
    if (!user) return { error: new Error('Não autenticado') };
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (!error) await fetchProfile(user);
    return { error: error as Error | null };
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      loading, 
      signUp, 
      signIn, 
      signOut, 
      updateProfile, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
}