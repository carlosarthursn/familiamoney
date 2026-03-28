import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import { CalendarView } from "./components/CalendarView";
import { AnalysisView } from "./components/AnalysisView";
import { PlanningView } from "./components/PlanningView";
import { ProfileSettings } from "./components/ProfileSettings";
import { AppLayout } from "./components/AppLayout";
import NotFound from "./pages/NotFound";
import { SplashScreen } from "./components/SplashScreen";
import { useState, useEffect } from "react";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const [showInitialSplash, setShowInitialSplash] = useState(true);

  useEffect(() => {
    // Garante que o splash apareça por pelo menos 1.8s para a animação completar
    const timer = setTimeout(() => {
      setShowInitialSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Enquanto estiver carregando os dados do usuário ou o tempo mínimo do splash não passou
  if (loading || showInitialSplash) {
    return <SplashScreen />;
  }

  return (
    <Routes>
      {/* Se não houver usuário, qualquer rota leva para /auth */}
      <Route 
        path="/auth" 
        element={user ? <Navigate to="/" replace /> : <Auth />} 
      />
      
      <Route 
        path="/" 
        element={user ? <AppLayout /> : <Navigate to="/auth" replace />}
      >
        <Route index element={<Dashboard />} />
        <Route path="calendar" element={<CalendarView selectedDate={new Date()} onDateChange={() => {}} />} />
        <Route path="analysis" element={<AnalysisView selectedDate={new Date()} />} />
        <Route path="planning" element={<PlanningView />} />
        <Route path="profile" element={<ProfileSettings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;