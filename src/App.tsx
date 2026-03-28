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
    const timer = setTimeout(() => {
      setShowInitialSplash(false);
    }, 2000); // Aumentado levemente para dar tempo ao banco
    return () => clearTimeout(timer);
  }, []);

  // Mostra o splash enquanto o banco carrega OU enquanto o tempo mínimo não passou
  // Mas se o banco já carregou e o tempo passou, libera a tela
  if (showInitialSplash || loading) {
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