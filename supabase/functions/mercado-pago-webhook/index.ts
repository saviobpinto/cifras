import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const body = await req.json()
    const { action, data } = body

    // Escuta eventos de atualização/criação de pagamento no Mercado Pago
    if (action === "payment.created" || action === "payment.updated") {
      // 1. Busca os detalhes da transação diretamente na API do Mercado Pago por segurança
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Falha ao obter detalhes do pagamento: ${await response.text()}`);
      }

      const paymentDetail = await response.json()
      const userId = paymentDetail.external_reference // O ID do usuário que anexamos ao criar o checkout
      const status = paymentDetail.status

      // 2. Se o pagamento foi aprovado com sucesso
      if (status === 'approved' && userId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceRole)

        // Tentar salvar na tabela cifras_profiles
        try {
          const { error: profileError } = await supabase
            .from('cifras_profiles')
            .upsert({
              id: userId,
              is_premium: true,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' })
          
          if (profileError) {
            console.error("Erro ao salvar na tabela cifras_profiles:", profileError);
          }
        } catch (e) {
          console.warn("Falha ao salvar na tabela cifras_profiles (pode ser que ela não exista ainda).", e)
        }

        // Como garantia secundária de fallback rápido, atualiza os metadados do Auth do próprio Supabase
        const { error: authError } = await supabase.auth.admin.updateUserById(
          userId,
          { user_metadata: { is_premium: true } }
        )
        if (authError) {
          console.error("Erro ao atualizar metadados do Auth:", authError);
          throw authError;
        }

        console.log(`Sucesso! Usuário ${userId} promovido a Premium.`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
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
