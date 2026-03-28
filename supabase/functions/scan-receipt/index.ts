import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!anthropicKey) {
      console.error("[scan-receipt] ANTHROPIC_API_KEY não configurada nos Secrets");
      return new Response(JSON.stringify({ error: 'Configuração ausente no servidor.' }), { 
        status: 500, headers: corsHeaders 
      })
    }

    console.log("[scan-receipt] Iniciando análise com Claude 3.5 Sonnet...");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest", // Usando o alias 'latest' para maior estabilidade
        max_tokens: 1000,
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
              text: `Analise essa nota fiscal ou cupom e retorne APENAS JSON puro sem markdown nem backticks:
{
  "valor": 0.00,
  "categoria": "Alimentação|Transporte|Aluguel|Lazer|Contas|Saúde|Educação|Compras|Outros",
  "data": "DD/MM/YYYY",
  "descricao": "resumo breve do estabelecimento ou compra"
}`
            }
          ]
        }]
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error("[scan-receipt] Erro da Anthropic API:", data);
      const msg = data.error?.message || "Erro na API da IA";
      return new Response(JSON.stringify({ error: msg }), { 
        status: response.status, headers: corsHeaders 
      })
    }

    const rawText = data.content.map((i: any) => i.text || '').join('');
    console.log("[scan-receipt] Texto bruto recebido:", rawText);
    
    const cleanJson = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const categoryId = CATEGORY_MAP[parsed.categoria] || 'other';

    let formattedDate = new Date().toISOString().split('T')[0];
    if (parsed.data && parsed.data.includes('/')) {
      const parts = parsed.data.split('/');
      if (parts.length === 3) {
        // Tenta formatar DD/MM/YYYY para YYYY-MM-DD
        formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    const result = {
      valor: Number(parsed.valor) || 0,
      categoria: categoryId,
      data: formattedDate,
      descricao: parsed.descricao || "Compra via scanner"
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error("[scan-receipt] Erro crítico:", error.message)
    return new Response(JSON.stringify({ error: "Falha ao processar a nota fiscal." }), {
      status: 500, headers: corsHeaders
    })
  }
})