"use client";

import { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import { SplashScreen } from '@/components/SplashScreen';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Se o usuário está logado, mostra o splash antes do dashboard
        setShowSplash(true);
        const timer = setTimeout(() => {
          setShowSplash(false);
          setAuthReady(true);
        }, 1600); // Tempo da animação do splash
        return () => clearTimeout(timer);
      } else {
        // Se não está logado, vai direto para o Auth
        setAuthReady(true);
      }
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ff7a00]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <>
      {showSplash && <SplashScreen />}
      {authReady && (user ? <Dashboard /> : <Auth />)}
    </>
  );
}

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;