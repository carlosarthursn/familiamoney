import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Chave da Anthropic fornecida
const ANTHROPIC_API_KEY = "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";

const CATEGORY_MAP: Record<string, string> = {
  'Alimentação': 'food',
  'Transporte': 'transport',
  'Aluguel': 'rent',
  'Lazer': 'leisure',
  'Contas': 'bills',
  'Saúde': 'health',
  'Educação': 'education',
  'Compras': 'shopping',
  'Outros': 'other'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageBase64 } = await req.json()

    console.log("[scan-receipt] Iniciando análise com Claude 3 Haiku (Vision)...");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307", // Modelo ultra estável com suporte a visão
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64
              }
            },
            {
              type: "text",
              text: `Analise essa nota fiscal e retorne APENAS JSON puro:
{
  "valor": 0.00,
  "categoria": "Alimentação|Transporte|Aluguel|Lazer|Contas|Saúde|Educação|Compras|Outros",
  "data": "DD/MM/YYYY",
  "descricao": "nome do estabelecimento ou item principal"
}`
            }
          ]
        }]
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error("[scan-receipt] Erro Anthropic:", data);
      return new Response(JSON.stringify({ error: data.error?.message || "Erro na IA" }), { 
        status: 500, headers: corsHeaders 
      })
    }

    const rawText = data.content[0].text;
    const cleanJson = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return new Response(JSON.stringify({
      valor: Number(parsed.valor) || 0,
      categoria: CATEGORY_MAP[parsed.categoria] || 'other',
      data: parsed.data,
      descricao: parsed.descricao
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error("[scan-receipt] Erro crítico:", error.message)
    return new Response(JSON.stringify({ error: "Falha ao processar nota." }), {
      status: 500, headers: corsHeaders
    })
  }
})