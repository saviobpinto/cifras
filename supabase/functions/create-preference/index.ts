import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Trata requisições de preflight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, email } = await req.json()

    if (!userId || !email) {
      throw new Error("userId e email são campos obrigatórios");
    }

    // Faz a chamada à API do Mercado Pago para criar a preferência de pagamento
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            title: "Acesso Premium Vitalício - My Setlist",
            quantity: 1,
            unit_price: 29.90, // Valor único de R$ 29,90
            currency_id: "BRL"
          }
        ],
        external_reference: userId, // ID do usuário do Supabase para conciliação no webhook
        payer: {
          email: email
        },
        back_urls: {
          success: "https://cifras-eta.vercel.app/settings?payment=success",
          failure: "https://cifras-eta.vercel.app/settings?payment=failure",
          pending: "https://cifras-eta.vercel.app/settings?payment=pending"
        },
        auto_return: "approved"
      })
    })

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro na API do Mercado Pago: ${errorData}`);
    }

    const preference = await response.json()

    // Retorna o link de redirecionamento (init_point) para o app
    return new Response(JSON.stringify({ checkoutUrl: preference.init_point }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
