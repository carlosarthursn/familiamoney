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
      const { data: dbProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();
      
      if (dbProfile) {
        const profileData = dbProfile as any;
        let pName: string | null = null;

        if (profileData.linked_user_id) {
          const { data: partner } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', profileData.linked_user_id)
            .maybeSingle();
          if (partner) pName = (partner as any).name || (partner as any).email?.split('@')[0];
        }

        setProfile({
          name: profileData.name || currentUser.email?.split('@')[0] || 'Usuário',
          linked_user_id: profileData.linked_user_id,
          partnerName: pName,
          monthly_budget: Number(profileData.monthly_budget) || 0
        });
      } else {
        // Se o perfil não existe, cria agora mesmo
        const newProfile = {
          id: currentUser.id,
          user_id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário',
          monthly_budget: 0
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile);

        if (!insertError) {
          setProfile({
            name: newProfile.name,
            monthly_budget: 0
          });
        } else {
          // Fallback local se o banco falhar
          setProfile({ name: newProfile.name, monthly_budget: 0 });
        }
      }
    } catch (e) {
      console.error("Erro ao gerenciar perfil:", e);
      setProfile({ name: currentUser.email?.split('@')[0] || 'Usuário' });
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          await fetchProfile(currentSession.user);
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
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

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    
    if (error) return { error };
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    window.location.replace('/');
  };

  const updateProfile = async (updates: any) => {
    if (!user) return { error: new Error('Unauthorized') };
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (!error) await fetchProfile(user);
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, updateProfile, refreshProfile: () => user && fetchProfile(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}