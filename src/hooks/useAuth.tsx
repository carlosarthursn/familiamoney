import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  name?: string;
  avatar_url?: string | null;
  linked_user_id?: string | null;
  partnerName?: string | null;
  partnerAvatar?: string | null;
  monthly_budget?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  showBalance: boolean;
  setShowBalance: (show: boolean) => void;
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
  const [showBalance, setShowBalance] = useState(true);

  const fetchProfile = useCallback(async (currentUser: User) => {
    try {
      const { data: dbProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      if (!dbProfile) return null;

      const profileData = dbProfile as any;
      let pName: string | null = null;
      let pAvatar: string | null = null;

      if (profileData.linked_user_id) {
        const { data: partner } = await supabase
          .from('profiles')
          .select('name, email, avatar_url')
          .eq('id', profileData.linked_user_id)
          .maybeSingle();
        if (partner) {
          pName = (partner as any).name || (partner as any).email?.split('@')[0];
          pAvatar = (partner as any).avatar_url;
        }
      }

      const finalProfile = {
        name: profileData.name || currentUser.email?.split('@')[0] || 'Usuário',
        avatar_url: profileData.avatar_url,
        linked_user_id: profileData.linked_user_id,
        partnerName: pName,
        partnerAvatar: pAvatar,
        monthly_budget: Number(profileData.monthly_budget) || 0
      };

      try {
        localStorage.setItem(`confere_profile_${currentUser.id}`, JSON.stringify(finalProfile));
      } catch (e) {}

      return finalProfile;
    } catch (e) {
      console.error("Erro ao buscar perfil:", e);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let isInitialized = false;

    const loadUserData = async (newUser: User, newSession: Session | null) => {
      setUser(newUser);
      setSession(newSession);

      // Tenta carregar do cache instantaneamente
      try {
        const cachedProfileStr = localStorage.getItem(`confere_profile_${newUser.id}`);
        if (cachedProfileStr) {
          setProfile(JSON.parse(cachedProfileStr));
          if (mounted) {
            setLoading(false);
            isInitialized = true;
          }
        }
      } catch (e) {}
      
      // Busca os dados atualizados em background
      const p = await fetchProfile(newUser);
      if (mounted) {
        if (p) setProfile(p);
        setLoading(false);
        isInitialized = true;
      }
    };

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (currentSession?.user && mounted) {
          await loadUserData(currentSession.user, currentSession);
        } else if (mounted) {
          setLoading(false);
          isInitialized = true;
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (mounted) {
          setLoading(false);
          isInitialized = true;
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const newUser = newSession?.user ?? null;
        if (newUser) {
          await loadUserData(newUser, newSession);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setProfile(null);
        if (mounted) {
          setLoading(false);
          isInitialized = true;
        }
      }
    });

    // Failsafe: Trava de segurança. Se por algum motivo não resolver em 3 segundos, libera o app.
    const failsafeTimeout = setTimeout(() => {
      if (mounted && !isInitialized) {
        console.warn("Auth initialization timeout - forcing load");
        setLoading(false);
      }
    }, 3000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(failsafeTimeout);
    };
  }, [fetchProfile]);

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
    setLoading(true);
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: any) => {
    if (!user) return { error: new Error('Não autenticado') };
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (!error) {
      const p = await fetchProfile(user);
      setProfile(p);
    }
    return { error: error as Error | null };
  };

  const linkPartner = async (partnerId: string) => {
    const { error } = await supabase.rpc('link_profiles', { partner_uuid: partnerId });
    if (!error && user) {
      const p = await fetchProfile(user);
      setProfile(p);
    }
    return { error };
  };

  const unlinkPartner = async () => {
    const { error } = await supabase.rpc('unlink_profiles');
    if (!error && user) {
      const p = await fetchProfile(user);
      setProfile(p);
    }
    return { error };
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user);
      setProfile(p);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, session, profile, loading, 
      showBalance, setShowBalance,
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