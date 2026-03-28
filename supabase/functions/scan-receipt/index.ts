import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageBase64 } = await req.json()
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!anthropicKey) {
      console.error("[scan-receipt] ANTHROPIC_API_KEY não configurada")
      return new Response(JSON.stringify({ error: 'Configuração ausente' }), { 
        status: 500, headers: corsHeaders 
      })
    }

    console.log("[scan-receipt] Iniciando análise com Claude Vision")

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
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
              text: `Analise esta nota fiscal/cupom e retorne APENAS um objeto JSON válido, sem blocos de código ou explicações. 
              
              Mapeie a categoria para um destes IDs: food, rent, transport, leisure, bills, health, education, shopping, other.
              
              Estrutura esperada:
              {
                "valor": 0.00,
                "categoria": "ID_DA_CATEGORIA",
                "data": "YYYY-MM-DD",
                "descricao": "NOME DO ESTABELECIMENTO OU RESUMO"
              }`
            }
          ]
        }]
      })
    })

    const data = await response.json()
    const content = data.content[0].text
    
    // Tenta extrair apenas o JSON caso o modelo retorne texto extra
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error("[scan-receipt] Erro:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: corsHeaders
    })
  }
})