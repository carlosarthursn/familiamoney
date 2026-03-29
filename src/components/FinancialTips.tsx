"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Lightbulb, RefreshCw } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cn } from '@/lib/utils';

const GEMINI_API_KEY = "AIzaSyCBVoAh31lqQN5NYngNIV5k27s2QUbPkD8";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const FALLBACK_TIPS = [
  "Poupe pelo menos 10% do que ganha todos os meses.",
  "Antes de comprar, espere 24h para evitar o impulso.",
  "Anote todos os gastos, até o cafezinho de R$ 2,00.",
  "Crie uma reserva de emergência para imprevistos.",
  "Compare preços em pelo menos 3 lojas diferentes.",
  "Evite parcelar compras pequenas no cartão de crédito.",
  "Revise suas assinaturas mensais e cancele o que não usa.",
  "Defina um limite de gastos para lazer toda semana.",
  "Pague suas contas no dia do vencimento para evitar juros.",
  "Considere comprar itens usados em bom estado para economizar.",
  "Faça uma lista de compras antes de ir ao supermercado.",
  "Não vá ao mercado com fome para evitar compras extras.",
  "Invista em conhecimento sobre finanças pessoais.",
  "Dê preferência para pagamentos à vista com desconto.",
  "Evite o uso do limite do cheque especial.",
  "Troque marcas famosas por marcas próprias do mercado.",
  "Leve marmita para o trabalho e economize com almoços.",
  "Apague as luzes de cômodos vazios para reduzir a conta.",
  "Defina metas financeiras claras de curto e longo prazo.",
  "Comemore as pequenas vitórias financeiras em família."
];

export function FinancialTips() {
  const [tip, setTip] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchTip = async () => {
    setLoading(true);
    try {
      // Tenta IA
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = "Dê uma dica financeira curta, prática e diferente da anterior para uma família. Máximo 80 caracteres. Português Brasil.";
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/"/g, '').trim();
      
      if (text && text.length > 5) {
        setTip(text);
      } else {
        throw new Error("Dica muito curta");
      }
    } catch (error) {
      // Fallback garantido
      const randomTip = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
      setTip(randomTip);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Escolhe uma dica aleatória ao carregar para não ficar sempre a mesma
    const initialTip = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
    setTip(initialTip);
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
            <p className="text-xs text-foreground leading-relaxed italic pr-2">
              "{loading ? 'Buscando...' : tip}"
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}