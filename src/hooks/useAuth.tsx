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
      
      if (fetchError) {
        console.error("Erro ao buscar perfil:", fetchError);
        return;
      }

      if (dbProfile) {
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
      } else {
        const newProfile = {
          id: currentUser.id,
          user_id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário',
          monthly_budget: 0
        };
        await supabase.from('profiles').insert(newProfile);
        setProfile({ name: newProfile.name, monthly_budget: 0, avatar_url: null });
      }
    } catch (e) {
      console.error("Auth: Falha crítica ao carregar perfil:", e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchProfile(currentSession.user);
        }
      } catch (error) {
        console.error("Erro na inicialização do auth:", error);
      } finally {
        if (mounted) setLoading(false);
      }
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
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      window.location.assign('/');
    } catch (error) {
      console.error("Erro ao sair:", error);
      window.location.assign('/');
    }
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
      user, 
      session, 
      profile, 
      loading, 
      signUp, 
      signIn, 
      signOut, 
      updateProfile,
      linkPartner,
      unlinkPartner,
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