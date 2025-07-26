import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '', 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper function para respostas com CORS
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Método não permitido' }, 405);
    }

    const { gateway, price_id, success_url, cancel_url } = await req.json();

    // Validar parâmetros
    if (!gateway || !price_id || !success_url || !cancel_url) {
      return corsResponse({ error: 'Parâmetros obrigatórios ausentes' }, 400);
    }

    if (!['stripe', 'mercadopago'].includes(gateway)) {
      return corsResponse({ error: 'Gateway de pagamento inválido' }, 400);
    }

    // Autenticar usuário
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      return corsResponse({ error: 'Falha na autenticação do usuário' }, 401);
    }

    // Buscar configurações do gateway
    const { data: gatewayConfig, error: gatewayError } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('gateway_name', gateway)
      .eq('is_active', true)
      .single();

    if (gatewayError || !gatewayConfig) {
      return corsResponse({ error: 'Gateway de pagamento não configurado' }, 500);
    }

    if (gateway === 'stripe') {
      return await handleStripeCheckout(user, gatewayConfig, price_id, success_url, cancel_url);
    } else if (gateway === 'mercadopago') {
      return await handleMercadoPagoCheckout(user, gatewayConfig, price_id, success_url, cancel_url);
    }

    return corsResponse({ error: 'Gateway não suportado' }, 400);
  } catch (error: any) {
    console.error('Erro no checkout:', error);
    return corsResponse({ error: error.message }, 500);
  }
});

async function handleStripeCheckout(
  user: any,
  gatewayConfig: any,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  try {
    const stripe = new Stripe(gatewayConfig.secret_key_encrypted, {
      appInfo: {
        name: 'Correria.Pro',
        version: '1.0.0',
      },
    });

    // Criar ou buscar customer
    let customerId = '';
    
    // Buscar customer existente
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Criar novo customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
      },
    });

    return corsResponse({ 
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error: any) {
    console.error('Erro no Stripe:', error);
    return corsResponse({ error: error.message }, 500);
  }
}

async function handleMercadoPagoCheckout(
  user: any,
  gatewayConfig: any,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  try {
    // Implementação do Mercado Pago seria aqui
    // Por enquanto, retornar erro informativo
    return corsResponse({ 
      error: 'Mercado Pago em desenvolvimento. Use Stripe por enquanto.' 
    }, 501);
  } catch (error: any) {
    console.error('Erro no Mercado Pago:', error);
    return corsResponse({ error: error.message }, 500);
  }
}