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
    const { action, data, userId } = body

    let targetUserId = null
    let shouldPromote = false

    // Escuta eventos de atualização/criação de pagamento no Mercado Pago
    if (action === "payment.created" || action === "payment.updated") {
      if (data && data.id) {
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
        targetUserId = paymentDetail.external_reference
        const status = paymentDetail.status
        if (status === 'approved') {
          shouldPromote = true
        }
      }
    } else if (userId) {
      // Fluxo de verificação manual / automática via app
      // Busca qualquer pagamento aprovado para este external_reference (userId) no Mercado Pago
      const response = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${userId}`, {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Falha ao buscar pagamentos no Mercado Pago: ${await response.text()}`);
      }

      const searchResult = await response.json()
      // Filtra por pagamentos aprovados
      const approvedPayment = searchResult.results?.find((p: any) => p.status === 'approved')
      
      if (approvedPayment) {
        targetUserId = userId
        shouldPromote = true
      } else {
        return new Response(JSON.stringify({ 
          success: false, 
          isPremium: false, 
          message: "Nenhum pagamento aprovado encontrado no Mercado Pago para esta conta. Se você acabou de pagar, aguarde alguns segundos e verifique novamente." 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        })
      }
    }

    if (shouldPromote && targetUserId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceRole)

      // 1. Tentar salvar na tabela cifras_profiles
      try {
        const { error: profileError } = await supabase
          .from('cifras_profiles')
          .upsert({
            id: targetUserId,
            is_premium: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })
        
        if (profileError) {
          console.error("Erro ao salvar na tabela cifras_profiles:", profileError);
        }
      } catch (e) {
        console.warn("Falha ao salvar na tabela cifras_profiles (pode ser que ela não exista ainda).", e)
      }

      // 2. Como garantia secundária de fallback rápido, atualiza os metadados do Auth do próprio Supabase
      const { error: authError } = await supabase.auth.admin.updateUserById(
        targetUserId,
        { user_metadata: { is_premium: true } }
      )
      if (authError) {
        console.error("Erro ao atualizar metadados do Auth:", authError);
        throw authError;
      }

      console.log(`Sucesso! Usuário ${targetUserId} promovido a Premium.`);
      return new Response(JSON.stringify({ success: true, isPremium: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
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
