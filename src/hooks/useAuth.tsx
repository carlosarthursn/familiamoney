import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
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

  const fetchProfile = async (currentUser: User) => {
    try {
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      
      if (dbProfile) {
        const profileData = dbProfile as any;
        let partnerName: string | null = null;

        if (profileData.linked_user_id) {
          const { data: partner } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('user_id', profileData.linked_user_id)
            .maybeSingle();
          if (partner) partnerName = (partner as any).name || (partner as any).email?.split('@')[0];
        }

        setProfile({
          name: profileData.name || currentUser.email?.split('@')[0] || 'Usuário',
          linked_user_id: profileData.linked_user_id,
          partnerName,
          monthly_budget: Number(profileData.monthly_budget) || 0
        });
      } else {
        // Fallback imediato se o perfil não existir
        setProfile({
          name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário',
          monthly_budget: 0
        });
        
        // Criar perfil em background
        supabase.from('profiles').upsert({
          id: currentUser.id,
          user_id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0],
          monthly_budget: 0
        } as any).catch(console.error);
      }
    } catch (err) {
      console.error("Erro no fetchProfile:", err);
      setProfile({ name: currentUser.email?.split('@')[0] || 'Usuário', monthly_budget: 0 });
    }
  };

  useEffect(() => {
    // Timeout de segurança: nunca deixa o loading travar por mais de 2.5s
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 2500);

    const init = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) await fetchProfile(initialSession.user);
      } finally {
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    
    if (error) {
      setLoading(false);
      return { error: error as Error };
    }

    if (data.user) {
      // Forçar criação do perfil
      await supabase.from('profiles').upsert({
        id: data.user.id,
        user_id: data.user.id,
        email,
        name,
        monthly_budget: 0
      } as any);
      await fetchProfile(data.user);
    }
    
    setLoading(false);
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return { error: error as Error };
    }
    if (data.user) await fetchProfile(data.user);
    setLoading(false);
    return { error: null };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(false);
    window.location.replace('/');
  };

  const updateProfile = async (updates: any) => {
    if (!user) return { error: new Error('Não logado') };
    const { error } = await supabase.from('profiles').update(updates).eq('user_id', user.id);
    if (!error) await fetchProfile(user);
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, updateProfile, refreshProfile: () => fetchProfile(user!) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}