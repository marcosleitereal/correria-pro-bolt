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
    console.log('🚀 CREATE-CHECKOUT: Função iniciada');
    console.log('📡 CREATE-CHECKOUT: Método:', req.method);
    console.log('🌐 CREATE-CHECKOUT: URL:', req.url);
    
    if (req.method === 'OPTIONS') {
      console.log('✅ CREATE-CHECKOUT: Respondendo OPTIONS');
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      console.log('❌ CREATE-CHECKOUT: Método não permitido:', req.method);
      return corsResponse({ error: 'Método não permitido' }, 405);
    }

    const body = await req.text();
    console.log('📥 CREATE-CHECKOUT: Body recebido:', body);
    
    let requestData;
    try {
      requestData = JSON.parse(body);
    } catch (parseError) {
      console.error('❌ CREATE-CHECKOUT: Erro ao parsear JSON:', parseError);
      return corsResponse({ error: 'JSON inválido' }, 400);
    }
    
    const { gateway, price_id, success_url, cancel_url } = requestData;
    
    console.log('📊 CREATE-CHECKOUT: Parâmetros recebidos:', {
      gateway,
      price_id,
      success_url,
      cancel_url
    });

    // Validar parâmetros
    if (!gateway || !price_id || !success_url || !cancel_url) {
      console.error('❌ CREATE-CHECKOUT: Parâmetros obrigatórios ausentes:', {
        gateway: !!gateway,
        price_id: !!price_id,
        success_url: !!success_url,
        cancel_url: !!cancel_url
      });
      return corsResponse({ error: 'Parâmetros obrigatórios ausentes' }, 400);
    }

    if (!['stripe', 'mercadopago'].includes(gateway)) {
      console.error('❌ CREATE-CHECKOUT: Gateway inválido:', gateway);
      return corsResponse({ error: 'Gateway de pagamento inválido' }, 400);
    }

    // Autenticar usuário
    const authHeader = req.headers.get('Authorization')!;
    console.log('🔑 CREATE-CHECKOUT: Header de autorização:', !!authHeader);
    
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      console.error('❌ CREATE-CHECKOUT: Erro de autenticação:', getUserError);
      return corsResponse({ error: 'Falha na autenticação do usuário' }, 401);
    }

    console.log('✅ CREATE-CHECKOUT: Usuário autenticado:', user.id);

    // Buscar configurações do gateway
    console.log('🔍 CREATE-CHECKOUT: Buscando configurações do gateway:', gateway);
    const { data: gatewayConfig, error: gatewayError } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('gateway_name', gateway)
      .single();

    if (gatewayError || !gatewayConfig) {
      console.error('❌ CREATE-CHECKOUT: Gateway não configurado:', {
        gateway,
        error: gatewayError,
        config: gatewayConfig
      });
      return corsResponse({ 
        error: `Gateway ${gateway} não configurado. Configure as chaves no painel admin.`,
        details: gatewayError?.message 
      }, 500);
    }

    console.log('✅ CREATE-CHECKOUT: Configuração do gateway encontrada');
    console.log('🔧 CREATE-CHECKOUT: Gateway ativo:', gatewayConfig.is_active);
    console.log('🔑 CREATE-CHECKOUT: Tem chave pública:', !!gatewayConfig.public_key);
    console.log('🔐 CREATE-CHECKOUT: Tem chave secreta:', !!gatewayConfig.secret_key_encrypted);

    if (gateway === 'stripe') {
      console.log('💳 CREATE-CHECKOUT: Processando com Stripe');
      return await handleStripeCheckout(user, gatewayConfig, price_id, success_url, cancel_url);
    } else if (gateway === 'mercadopago') {
      console.log('💰 CREATE-CHECKOUT: Processando com Mercado Pago');
      return await handleMercadoPagoCheckout(user, gatewayConfig, price_id, success_url, cancel_url);
    }

    console.error('❌ CREATE-CHECKOUT: Gateway não suportado:', gateway);
    return corsResponse({ error: 'Gateway não suportado' }, 400);
  } catch (error: any) {
    console.error('❌ CREATE-CHECKOUT: Erro crítico:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
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
    console.log('🔵 STRIPE: Iniciando processamento Stripe');
    console.log('🔵 STRIPE: Price ID:', priceId);
    console.log('🔵 STRIPE: User ID:', user.id);
    
    if (!gatewayConfig.secret_key_encrypted) {
      console.error('❌ STRIPE: Chave secreta não configurada');
      return corsResponse({ 
        error: 'Chave secreta do Stripe não configurada. Configure no painel admin.' 
      }, 500);
    }
    
    const stripe = new Stripe(gatewayConfig.secret_key_encrypted, {
      appInfo: {
        name: 'Correria.Pro',
        version: '1.0.0',
      },
    });

    console.log('✅ STRIPE: Cliente Stripe inicializado');

    // Criar ou buscar customer
    let customerId = '';
    
    console.log('🔍 STRIPE: Buscando customer existente para:', user.email);
    // Buscar customer existente
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('✅ STRIPE: Customer existente encontrado:', customerId);
    } else {
      console.log('🆕 STRIPE: Criando novo customer');
      // Criar novo customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
      console.log('✅ STRIPE: Novo customer criado:', customerId);
    }

    console.log('🛒 STRIPE: Criando sessão de checkout');
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
        gateway: 'stripe',
        plan_price_id: priceId
      },
    });

    console.log('✅ STRIPE: Sessão criada com sucesso:', session.id);
    console.log('🔗 STRIPE: URL de checkout:', session.url);

    return corsResponse({ 
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error: any) {
    console.error('❌ STRIPE: Erro crítico:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });
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