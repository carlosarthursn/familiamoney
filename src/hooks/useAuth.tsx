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
        .select('name, email, linked_user_id, user_id, monthly_budget')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setProfile({ name: 'Usuário', linked_user_id: null, partnerName: null, monthly_budget: 0 });
        return;
      }

      if (!dbProfile) {
        setProfile({ 
          name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário', 
          linked_user_id: null, 
          partnerName: null,
          monthly_budget: 0
        });
        return;
      }

      const profileData = dbProfile as { name?: string; linked_user_id?: string; email?: string, monthly_budget?: number };
      const linkedId = profileData?.linked_user_id || null;
      let partnerName: string | null = null;

      if (linkedId) {
        const { data: partnerProfile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('user_id', linkedId)
          .maybeSingle();
        
        const partnerData = partnerProfile as { name?: string; email?: string } | null;
        if (partnerData) {
          partnerName = partnerData.name || partnerData.email?.split('@')[0] || 'Parceiro';
        }
      }
      
      setProfile({
        name: profileData?.name || profileData?.email?.split('@')[0] || 'Usuário',
        linked_user_id: linkedId,
        partnerName,
        monthly_budget: profileData?.monthly_budget || 0
      });
    } catch (error) {
      console.error("Error in fetchProfile:", error);
      setProfile({ name: 'Usuário', linked_user_id: null, partnerName: null, monthly_budget: 0 });
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
          void fetchProfile(currentUser);
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error("Error initializing auth:", e);
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
    
    if (!error) {
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          user_id: newUser.id,
          email: email,
          name: name,
          monthly_budget: 0
        } as any);
        
        if (profileError) {
          console.error("Error creating profile on sign up:", profileError);
        }
      }
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
      setUser(null);
      setProfile(null);
      setSession(null);
      window.location.replace('/');
    }
  };

  const updateProfile = async (updates: { name?: string; linked_user_id?: string | null; monthly_budget?: number }) => {
    if (!user) return { error: new Error('Usuário não logado') };

    const profileUpdates: any = {};
    if (updates.name !== undefined) profileUpdates.name = updates.name;
    if (updates.linked_user_id !== undefined) profileUpdates.linked_user_id = updates.linked_user_id;
    if (updates.monthly_budget !== undefined) profileUpdates.monthly_budget = updates.monthly_budget;
    
    if (Object.keys(profileUpdates).length === 0) {
      return { error: null };
    }

    const { error } = await supabase
      .from('profiles')
      .update(profileUpdates)
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