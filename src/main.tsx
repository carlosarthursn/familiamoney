import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// TRUQUE DE MESTRE: O "Wake-Up Ping" (Disparo de Acordar)
// Isso dispara um mini-pedido para o banco de dados no exato milissegundo 
// que o aplicativo abre, antes mesmo do React e das telas terminarem de carregar.
// Assim, enquanto o usuário vê a interface instantaneamente (pelo cache local), 
// o banco de dados (que pode estar dormindo) já está "acordando" em background.
try {
  fetch("https://vipigovrygzyjaibssra.supabase.co/rest/v1/profiles?select=id&limit=1", {
    headers: {
      "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcGlnb3ZyeWd6eWphaWJzc3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzgzNTMsImV4cCI6MjA4NTA1NDM1M30.Z5hyETn-WMuagY6yiBlyFWTahUm7SSWl4j-m1uI4x9U",
    }
  }).catch(() => {});
} catch (e) {}

createRoot(document.getElementById("root")!).render(<App />);