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
      const { data: dbProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      
      if (profileError) {
        console.error("Erro ao buscar perfil:", profileError);
        return;
      }

      // Se a tabela existe mas não tem o registro do usuário (auto-correção)
      if (!dbProfile) {
        const defaultName = currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário';
        const { data: newProfile } = await supabase.from('profiles').upsert({
          user_id: currentUser.id,
          email: currentUser.email,
          name: defaultName,
          monthly_budget: 0
        } as any).select().single();
        
        if (newProfile) {
          setProfile({
            name: (newProfile as any).name,
            linked_user_id: null,
            partnerName: null,
            monthly_budget: 0
          });
        }
        return;
      }

      const profileData = dbProfile as any;
      const linkedId = profileData?.linked_user_id || null;
      let partnerName: string | null = null;

      if (linkedId) {
        const { data: partnerProfile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('user_id', linkedId)
          .maybeSingle();
        
        if (partnerProfile) {
          partnerName = (partnerProfile as any).name || (partnerProfile as any).email?.split('@')[0] || 'Parceiro';
        }
      }
      
      setProfile({
        name: profileData?.name || profileData?.email?.split('@')[0] || 'Usuário',
        linked_user_id: linkedId,
        partnerName,
        monthly_budget: profileData?.monthly_budget || 0
      });
    } catch (error) {
      console.error("Erro inesperado no fetchProfile:", error);
    }
  };

  const refreshProfile = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      setUser(currentUser);
      await fetchProfile(currentUser);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser);
        }
      } catch (e) {
        console.error("Erro ao inicializar auth:", e);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false);
        
        if (currentUser) {
          void fetchProfile(currentUser);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
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
      setUser(null);
      setProfile(null);
      setSession(null);
      window.location.replace('/');
    }
  };

  const updateProfile = async (updates: { name?: string; linked_user_id?: string | null; monthly_budget?: number }) => {
    if (!user) return { error: new Error('Usuário não logado') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (error) return { error: error as Error };
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