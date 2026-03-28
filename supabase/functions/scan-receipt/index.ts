import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageBase64 } = await req.json()
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    console.log("[scan-receipt] Recebida solicitação de análise de imagem")

    if (!anthropicKey) {
      console.error("[scan-receipt] ERRO: ANTHROPIC_API_KEY não encontrada no ambiente")
      return new Response(JSON.stringify({ error: 'Chave ANTHROPIC_API_KEY não configurada no Supabase' }), { 
        status: 500, headers: corsHeaders 
      })
    }

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'Imagem não fornecida' }), { 
        status: 400, headers: corsHeaders 
      })
    }

    console.log("[scan-receipt] Chamando API do Claude 3.5 Sonnet...")

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
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
              text: `Analise esta nota fiscal ou cupom e retorne APENAS um JSON puro.
              
              IDs de categorias permitidos: food, transport, rent, leisure, bills, health, education, shopping, other.
              
              Retorne neste formato exato:
              {
                "valor": 0.00,
                "categoria": "id_da_categoria",
                "data": "YYYY-MM-DD",
                "descricao": "Resumo curto"
              }`
            }
          ]
        }]
      })
    })

    const data = await response.json()
    
    if (data.error) {
      console.error("[scan-receipt] Erro da Anthropic:", data.error)
      return new Response(JSON.stringify({ error: data.error.message || 'Erro na API Vision' }), { 
        status: 500, headers: corsHeaders 
      })
    }

    const textResponse = data.content[0].text
    console.log("[scan-receipt] Resposta bruta do Claude:", textResponse)
    
    // Tenta extrair o JSON de forma segura
    let result;
    try {
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(textResponse)
    } catch (e) {
      console.error("[scan-receipt] Erro ao parsear JSON do Claude:", textResponse)
      throw new Error("Resposta da IA não está em formato JSON válido")
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error("[scan-receipt] Erro fatal na Edge Function:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: corsHeaders
    })
  }
})