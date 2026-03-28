import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { AddTransactionSheet } from "./AddTransactionSheet";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SuccessOverlay } from "./SuccessOverlay";

export function AppLayout() {
  const { profile } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path.includes("calendar")) return "calendar";
    if (path.includes("analysis")) return "analysis";
    if (path.includes("planning")) return "planning";
    if (path.includes("profile")) return "profile";
    return "home";
  };

  const handleTabChange = (tab: string) => {
    if (tab === "home") navigate("/");
    else navigate(`/${tab}`);
  };

  const shouldShowHeader = location.pathname === "/" || location.pathname === "/profile";

  return (
    <div className="min-h-screen bg-background pb-24">
      {showSuccess && <SuccessOverlay message={successMsg} onFinished={() => setShowSuccess(false)} />}
      
      {shouldShowHeader && (
        <Header 
          displayName={profile?.name || "Usuário"} 
          showBalance={showBalance}
          setShowBalance={setShowBalance}
          onProfileClick={() => navigate("/profile")}
          onAnalysisClick={() => navigate("/analysis")}
        />
      )}

      <main className="px-6 pt-6">
        <Outlet />
      </main>

      <AddTransactionSheet />
      <BottomNav activeTab={getActiveTab()} onTabChange={handleTabChange} />
    </div>
  );
}