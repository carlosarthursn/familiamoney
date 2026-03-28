"use client";

import { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import { SplashScreen } from '@/components/SplashScreen';

function AppContent() {
  const { user, loading } = useAuth();
  const [splashFinished, setSplashFinished] = useState(false);

  useEffect(() => {
    // Se não estiver carregando e o usuário for nulo, não precisamos de splash longo
    if (!loading && !user) {
      setSplashFinished(true);
    }
    
    // Timer de segurança para a animação da splash
    if (user) {
      const timer = setTimeout(() => {
        setSplashFinished(true);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  // Se estiver carregando inicialmente ou a animação da splash não acabou, mostra Splash
  if (loading || (!splashFinished && user)) {
    return <SplashScreen />;
  }

  // Uma vez carregado e splash finalizada (ou se for pra tela de login)
  return user ? <Dashboard /> : <Auth />;
}

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;