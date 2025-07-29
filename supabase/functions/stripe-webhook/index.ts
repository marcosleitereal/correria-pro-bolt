import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!, 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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
    console.log('🎯 WEBHOOK: Stripe webhook recebido');
    
    if (req.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Método não permitido' }, 405);
    }

    // Buscar configuração do Stripe
    const { data: stripeConfig, error: configError } = await supabase
      .from('payment_gateways')
      .select('secret_key_encrypted, webhook_secret')
      .eq('gateway_name', 'stripe')
      .single();

    if (configError || !stripeConfig) {
      console.error('❌ WEBHOOK: Stripe não configurado:', configError);
      return corsResponse({ error: 'Stripe não configurado' }, 500);
    }

    console.log('✅ WEBHOOK: Configuração do Stripe encontrada');

    const stripe = new Stripe(stripeConfig.secret_key_encrypted, {
      appInfo: {
        name: 'Correria.Pro',
        version: '1.0.0',
      },
    });

    // Get the signature from the header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('❌ WEBHOOK: Assinatura não encontrada');
      return corsResponse({ error: 'Assinatura não encontrada' }, 400);
    }

    // Get the raw body
    const body = await req.text();
    console.log('📥 WEBHOOK: Body recebido, tamanho:', body.length);

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body, 
        signature, 
        stripeConfig.webhook_secret || Deno.env.get('STRIPE_WEBHOOK_SECRET')!
      );
      console.log('✅ WEBHOOK: Assinatura verificada com sucesso');
    } catch (error: any) {
      console.error('❌ WEBHOOK: Falha na verificação da assinatura:', error.message);
      return corsResponse({ error: `Falha na verificação: ${error.message}` }, 400);
    }

    console.log('🎯 WEBHOOK: Processando evento:', event.type);

    // Process the event
    EdgeRuntime.waitUntil(handleEvent(event));

    return corsResponse({ received: true });
  } catch (error: any) {
    console.error('❌ WEBHOOK: Erro crítico:', error);
    return corsResponse({ error: error.message }, 500);
  }
});

async function handleEvent(event: Stripe.Event) {
  try {
    console.log(`🔄 WEBHOOK: Processando evento: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    } else if (event.type === 'customer.subscription.created') {
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
    } else if (event.type === 'customer.subscription.updated') {
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
    } else if (event.type === 'customer.subscription.deleted') {
      await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
    } else if (event.type === 'invoice.payment_succeeded') {
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
    } else if (event.type === 'invoice.payment_failed') {
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
    } else {
      console.log(`⚠️ WEBHOOK: Evento não tratado: ${event.type}`);
    }
  } catch (error) {
    console.error('❌ WEBHOOK: Erro ao processar evento:', error);
    throw error;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('💳 WEBHOOK: Processando checkout completado:', session.id);
  
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  
  console.log('📊 WEBHOOK: Dados do checkout:', {
    customer_id: customerId,
    subscription_id: subscriptionId,
    payment_status: session.payment_status
  });

  if (!customerId) {
    console.error('❌ WEBHOOK: Customer ID não encontrado');
    return;
  }

  // Buscar usuário pelo customer_id
  const { data: customerData, error: customerError } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .single();

  if (customerError || !customerData) {
    console.error('❌ WEBHOOK: Usuário não encontrado para customer:', customerId, customerError);
    return;
  }

  const userId = customerData.user_id;
  console.log('👤 WEBHOOK: Usuário encontrado:', userId);

  // Se há subscription, buscar dados da subscription
  if (subscriptionId) {
    console.log('🔍 WEBHOOK: Buscando dados da subscription:', subscriptionId);
    
    const { data: stripeConfig } = await supabase
      .from('payment_gateways')
      .select('secret_key_encrypted')
      .eq('gateway_name', 'stripe')
      .single();

    if (!stripeConfig) {
      console.error('❌ WEBHOOK: Configuração do Stripe não encontrada');
      return;
    }

    const stripe = new Stripe(stripeConfig.secret_key_encrypted);
    
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      console.log('📋 WEBHOOK: Subscription encontrada:', {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end
      });

      // Buscar plano baseado no price_id
      const priceId = subscription.items.data[0]?.price?.id;
      console.log('💰 WEBHOOK: Price ID:', priceId);

      const { data: plan } = await supabase
        .from('plans')
        .select('id, name')
        .eq('stripe_price_id_monthly', priceId)
        .single();

      console.log('📦 WEBHOOK: Plano encontrado:', plan);

      // CRÍTICO: Atualizar assinatura do usuário
      const subscriptionData = {
        user_id: userId,
        plan_id: plan?.id || null,
        status: 'active' as const,
        trial_ends_at: null, // Limpar trial
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💾 WEBHOOK: Atualizando assinatura:', subscriptionData);

      const { data: updatedSub, error: updateError } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData, { onConflict: 'user_id' })
        .select()
        .single();

      if (updateError) {
        console.error('❌ WEBHOOK: Erro ao atualizar assinatura:', updateError);
        throw updateError;
      }

      console.log('✅ WEBHOOK: Assinatura atualizada com sucesso:', updatedSub);

      // Criar log de auditoria
      await supabase.from('audit_logs').insert({
        actor_id: null,
        actor_email: 'stripe_webhook',
        action: 'SUBSCRIPTION_ACTIVATED',
        details: {
          user_id: userId,
          customer_id: customerId,
          subscription_id: subscriptionId,
          plan_name: plan?.name || 'Desconhecido',
          activated_at: new Date().toISOString()
        }
      });

      console.log('✅ WEBHOOK: Usuário liberado com sucesso!');

    } catch (stripeError) {
      console.error('❌ WEBHOOK: Erro ao buscar subscription no Stripe:', stripeError);
    }
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🆕 WEBHOOK: Nova subscription criada:', subscription.id);
  // Processar como checkout completed
  await handleSubscriptionUpdated(subscription);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 WEBHOOK: Subscription atualizada:', subscription.id);
  
  const customerId = subscription.customer as string;
  
  // Buscar usuário
  const { data: customerData } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .single();

  if (!customerData) {
    console.error('❌ WEBHOOK: Usuário não encontrado para customer:', customerId);
    return;
  }

  // Buscar plano
  const priceId = subscription.items.data[0]?.price?.id;
  const { data: plan } = await supabase
    .from('plans')
    .select('id, name')
    .eq('stripe_price_id_monthly', priceId)
    .single();

  // Atualizar assinatura
  const subscriptionData = {
    user_id: customerData.user_id,
    plan_id: plan?.id || null,
    status: subscription.status === 'active' ? 'active' as const : 'canceled' as const,
    trial_ends_at: null,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error: updateError } = await supabase
    .from('subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' });

  if (updateError) {
    console.error('❌ WEBHOOK: Erro ao atualizar subscription:', updateError);
  } else {
    console.log('✅ WEBHOOK: Subscription atualizada:', subscription.status);
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  console.log('❌ WEBHOOK: Subscription cancelada:', subscription.id);
  
  const customerId = subscription.customer as string;
  
  const { data: customerData } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .single();

  if (!customerData) return;

  await supabase
    .from('subscriptions')
    .update({ 
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', customerData.user_id);

  console.log('✅ WEBHOOK: Subscription cancelada para usuário:', customerData.user_id);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('💰 WEBHOOK: Pagamento bem-sucedido:', invoice.id);
  
  if (invoice.subscription) {
    // Buscar subscription e atualizar status
    const { data: stripeConfig } = await supabase
      .from('payment_gateways')
      .select('secret_key_encrypted')
      .eq('gateway_name', 'stripe')
      .single();

    if (stripeConfig) {
      const stripe = new Stripe(stripeConfig.secret_key_encrypted);
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      await handleSubscriptionUpdated(subscription);
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('💸 WEBHOOK: Pagamento falhou:', invoice.id);
  // Implementar lógica de falha de pagamento se necessário
}