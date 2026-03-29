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
import { useState, useEffect, useRef } from "react";

const queryClient = new QueryClient();

const CalendarRoute = () => {
  const [date, setDate] = useState(new Date());
  return <CalendarView selectedDate={date} onDateChange={setDate} />;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const prevUser = useRef(user);

  // Efeito para o carregamento inicial e transição de login
  useEffect(() => {
    // Se o usuário mudou de "null" para "autenticado", mostramos a splash
    if (!prevUser.current && user) {
      setShowSplash(true);
    }
    prevUser.current = user;

    if (!loading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2300); // Tempo para a animação do logo completar
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  if (showSplash || (loading && !user)) {
    return <SplashScreen />;
  }

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={user ? <Navigate to="/" replace /> : <Auth />} 
      />
      
      <Route 
        path="/" 
        element={user ? <AppLayout /> : <Navigate to="/auth" replace />}
      >
        <Route index element={<Dashboard />} />
        <Route path="calendar" element={<CalendarRoute />} />
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