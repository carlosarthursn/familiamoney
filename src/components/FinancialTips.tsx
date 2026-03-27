import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Lightbulb, RefreshCw } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cn } from '@/lib/utils';

const GEMINI_API_KEY = "AIzaSyCBVoAh31lqQN5NYngNIV5k27s2QUbPkD8";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export function FinancialTips() {
  const [tip, setTip] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchTip = async () => {
    setLoading(true);
    try {
      // Usando gemini-pro para texto, que é o mais estável
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = "Dê uma dica financeira curta, prática e motivadora para uma família brasileira. Máximo 150 caracteres.";
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setTip(response.text());
    } catch (error) {
      console.error("Erro ao buscar dica:", error);
      setTip("Pequenas economias hoje geram grandes conquistas amanhã. Comece anotando tudo!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTip();
  }, []);

  return (
    <Card className="bg-primary/5 border-primary/20 shadow-sm overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                Dica do Dia <Sparkles className="h-2 w-2" />
              </span>
              <button 
                onClick={fetchTip} 
                disabled={loading}
                className="text-muted-foreground hover:text-primary transition-colors p-1"
                type="button"
              >
                <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
              </button>
            </div>
            <p className="text-xs text-foreground leading-relaxed italic">
              "{loading ? 'Pensando em uma dica...' : tip}"
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}