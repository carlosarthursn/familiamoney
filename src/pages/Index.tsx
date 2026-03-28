"use client";

import { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import { SplashScreen } from '@/components/SplashScreen';

function AppContent() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Timer para garantir que a Splash dure pelo menos 1.6s para a animação ficar bonita
    const minTimer = setTimeout(() => {
      // Só escondemos a splash se o auth já terminou de carregar
      if (!loading) {
        setShowSplash(false);
      }
    }, 1600);

    // Se o loading terminar ANTES do timer, esperamos o timer.
    // Se o loading terminar DEPOIS do timer, escondemos assim que o loading mudar.
    if (!loading) {
      const checkLoading = setTimeout(() => {
        setShowSplash(false);
      }, 100);
      return () => {
        clearTimeout(minTimer);
        clearTimeout(checkLoading);
      };
    }

    return () => clearTimeout(minTimer);
  }, [loading]);

  // Válvula de segurança extra: se em 6 segundos a splash ainda estiver lá, removemos
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setShowSplash(false);
    }, 6000);
    return () => clearTimeout(safetyTimer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

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