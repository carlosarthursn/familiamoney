import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Lightbulb, RefreshCw } from 'lucide-react';
import OpenAI from "openai";
import { cn } from '@/lib/utils';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export function FinancialTips() {
  const [tip, setTip] = useState<string>('Poupe pelo menos 10% do que ganha todos os meses.');
  const [loading, setLoading] = useState(false);

  const fetchTip = async () => {
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um consultor financeiro familiar. Dê dicas curtas e práticas." },
          { role: "user", content: "Dê uma dica financeira curta para uma família brasileira. Máximo 100 caracteres." }
        ],
        max_tokens: 50,
      });

      const text = response.choices[0].message.content?.replace(/"/g, '') || tip;
      setTip(text);
    } catch (error) {
      console.error("Erro na OpenAI:", error);
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
              "{loading ? 'Consultando IA...' : tip}"
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}