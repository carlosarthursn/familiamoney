import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeamento de categorias para garantir compatibilidade com o app
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
      return new Response(JSON.stringify({ error: 'Configuração ausente: ANTHROPIC_API_KEY' }), { 
        status: 500, headers: corsHeaders 
      })
    }

    console.log("[scan-receipt] Enviando para Claude Vision...");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 500,
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
    
    if (data.error) throw new Error(data.error.message);

    const rawText = data.content.map((i: any) => i.text || '').join('');
    const cleanJson = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Mapeia o nome da categoria para o ID usado no banco
    const categoryId = CATEGORY_MAP[parsed.categoria] || 'other';

    // Formata a data de DD/MM/YYYY para YYYY-MM-DD (formato do banco)
    let formattedDate = new Date().toISOString().split('T')[0];
    if (parsed.data && parsed.data !== "Não informada") {
      const parts = parsed.data.split('/');
      if (parts.length === 3) {
        formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    const result = {
      valor: Number(parsed.valor),
      categoria: categoryId,
      data: formattedDate,
      descricao: parsed.descricao
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error("[scan-receipt] Erro:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: corsHeaders
    })
  }
})