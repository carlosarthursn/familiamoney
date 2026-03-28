import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  name?: string;
  avatar_url?: string | null;
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
  updateProfile: (updates: { name?: string; avatar_url?: string | null; linked_user_id?: string | null; monthly_budget?: number }) => Promise<{ error: Error | null }>;
  linkPartner: (partnerId: string) => Promise<{ error: any }>;
  unlinkPartner: () => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  registerPasskey: () => Promise<{ error: any }>;
  signInWithPasskey: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (currentUser: User) => {
    try {
      const { data: dbProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();
      
      if (fetchError || !dbProfile) return;

      const profileData = dbProfile as any;
      let pName: string | null = null;

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
        avatar_url: profileData.avatar_url,
        linked_user_id: profileData.linked_user_id,
        partnerName: pName,
        monthly_budget: Number(profileData.monthly_budget) || 0
      });
    } catch (e) {
      console.error("Auth profile fetch error:", e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(s);
        setUser(s?.user ?? null);
        
        if (s?.user) {
          // Buscamos o perfil mas NÃO bloqueamos o loading por isso
          fetchProfile(s.user);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Válvula de segurança: se após 5 segundos ainda estiver carregando, força o fim
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.log("Auth: Safety timeout triggered");
        setLoading(false);
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);
      
      if (newUser) await fetchProfile(newUser);
      else setProfile(null);
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchProfile, loading]);

  const signUp = async (email: string, password: string, name: string) => {
    return supabase.auth.signUp({ email, password, options: { data: { name } } });
  };

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const registerPasskey = async () => {
    return (supabase.auth as any).linkPasskey();
  };

  const signInWithPasskey = async () => {
    return (supabase.auth as any).signInWithPasskey();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    window.location.assign('/');
  };

  const updateProfile = async (updates: any) => {
    if (!user) return { error: new Error('Não autenticado') };
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (!error) await fetchProfile(user);
    return { error: error as Error | null };
  };

  const linkPartner = async (partnerId: string) => {
    const { error } = await supabase.rpc('link_profiles', { partner_uuid: partnerId });
    if (!error && user) await fetchProfile(user);
    return { error };
  };

  const unlinkPartner = async () => {
    const { error } = await supabase.rpc('unlink_profiles');
    if (!error && user) await fetchProfile(user);
    return { error };
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  return (
    <AuthContext.Provider value={{ 
      user, session, profile, loading, 
      signUp, signIn, signOut, updateProfile,
      linkPartner, unlinkPartner, refreshProfile,
      registerPasskey, signInWithPasskey
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