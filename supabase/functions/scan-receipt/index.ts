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
    console.log("[scan-receipt] Iniciando processamento de nota...");
    
    // Auth check (manual since verify_jwt is false by default)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: corsHeaders
      })
    }

    const { imageBase64 } = await req.json()
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!anthropicKey) {
      console.error("[scan-receipt] ANTHROPIC_API_KEY não configurada")
      return new Response(JSON.stringify({ error: 'Chave API não configurada no Supabase' }), { 
        status: 500, headers: corsHeaders 
      })
    }

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
              text: `Analise esta nota fiscal/cupom e retorne APENAS um JSON puro.
              
              Categorias (IDs): food, transport, rent, leisure, bills, health, education, shopping, other.
              
              Formato:
              {
                "valor": 0.00,
                "categoria": "id_da_categoria",
                "data": "YYYY-MM-DD",
                "descricao": "Nome do local"
              }`
            }
          ]
        }]
      })
    })

    const data = await response.json()
    const textResponse = data.content[0].text
    
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(textResponse)

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