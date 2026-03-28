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
      return new Response(JSON.stringify({ error: 'Chave API não configurada no Supabase' }), { 
        status: 500, headers: corsHeaders 
      })
    }

    console.log("[scan-receipt] Solicitando análise ao Claude 3.5 Sonnet Vision")

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
              text: `Analise esta nota fiscal ou cupom e retorne APENAS um JSON puro (sem markdown ou blocos de código).
              
              Mapeie a categoria para um destes IDs específicos:
              - 'food' para Alimentação
              - 'transport' para Transporte
              - 'rent' para Aluguel
              - 'leisure' para Lazer
              - 'bills' para Contas/Boletos
              - 'health' para Saúde
              - 'education' para Educação
              - 'shopping' para Compras
              - 'other' para Outros
              
              Estrutura estrita do JSON:
              {
                "valor": 0.00,
                "categoria": "ID_MATEADO",
                "data": "YYYY-MM-DD",
                "descricao": "Resumo do estabelecimento e itens"
              }`
            }
          ]
        }]
      })
    })

    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.message || 'Erro na API da Anthropic')
    }

    const textResponse = data.content[0].text
    console.log("[scan-receipt] Resposta bruta:", textResponse)
    
    // Extração robusta de JSON
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(textResponse)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error("[scan-receipt] Erro crítico:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: corsHeaders
    })
  }
})