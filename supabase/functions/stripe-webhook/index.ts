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
    payment_status: session.payment_status,
    mode: session.mode
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

  // ATIVAÇÃO IMEDIATA E ROBUSTA
  console.log('🚀 WEBHOOK: ATIVANDO USUÁRIO IMEDIATAMENTE');
  
  // Buscar primeiro plano ativo disponível (não restrito)
  const { data: activePlan, error: planError } = await supabase
    .from('plans')
    .select('id, name, price_monthly')
    .eq('is_active', true)
    .neq('name', 'Restrito')
    .order('price_monthly', { ascending: true })
    .limit(1)
    .single();

  if (planError || !activePlan) {
    console.error('❌ WEBHOOK: Nenhum plano ativo encontrado:', planError);
    // Continuar mesmo sem plano específico
  }

  console.log('📦 WEBHOOK: Plano para ativação:', activePlan?.name || 'Plano Padrão');

  // CRÍTICO: ATIVAR ASSINATURA IMEDIATAMENTE
  const now = new Date();
  const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const subscriptionData = {
    user_id: userId,
    plan_id: activePlan?.id || null,
    status: 'active' as const, // FORÇAR ATIVO
    trial_ends_at: null, // LIMPAR TRIAL
    current_period_start: now.toISOString(),
    current_period_end: oneMonthLater.toISOString(),
    updated_at: now.toISOString()
  };

  console.log('💾 WEBHOOK: Dados da ativação:', subscriptionData);

  // UPSERT FORÇADO - SOBRESCREVER QUALQUER ESTADO ANTERIOR
  const { data: activatedSub, error: activationError } = await supabase
    .from('subscriptions')
    .upsert(subscriptionData, { 
      onConflict: 'user_id',
      ignoreDuplicates: false // FORÇAR ATUALIZAÇÃO
    })
    .select()
    .single();

  if (activationError) {
    console.error('❌ WEBHOOK: ERRO CRÍTICO ao ativar assinatura:', activationError);
    
    // TENTATIVA DE RECUPERAÇÃO - DELETAR E RECRIAR
    console.log('🔄 WEBHOOK: Tentando recuperação - deletar e recriar');
    
    await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);
    
    const { data: newSub, error: newSubError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();
    
    if (newSubError) {
      console.error('❌ WEBHOOK: Falha na recuperação:', newSubError);
      throw new Error(`Falha crítica na ativação: ${newSubError.message}`);
    }
    
    console.log('✅ WEBHOOK: Recuperação bem-sucedida:', newSub);
  } else {
    console.log('✅ WEBHOOK: Assinatura ativada com sucesso:', activatedSub);
  }

  // VERIFICAÇÃO DUPLA - CONFIRMAR ATIVAÇÃO
  const { data: verificationData, error: verificationError } = await supabase
    .from('user_subscription_details')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (verificationError) {
    console.error('❌ WEBHOOK: Erro na verificação:', verificationError);
  } else {
    console.log('🔍 WEBHOOK: Verificação pós-ativação:', {
      user_id: verificationData.user_id,
      subscription_status: verificationData.subscription_status,
      has_access: verificationData.has_access,
      current_plan_name: verificationData.current_plan_name
    });
  }

  // Criar log de auditoria detalhado
  await supabase.from('audit_logs').insert({
    actor_id: null,
    actor_email: 'stripe_webhook',
    action: 'SUBSCRIPTION_ACTIVATED_CHECKOUT',
    details: {
      user_id: userId,
      customer_id: customerId,
      session_id: session.id,
      subscription_id: subscriptionId,
      plan_name: activePlan?.name || 'Plano Padrão',
      payment_status: session.payment_status,
      mode: session.mode,
      activated_at: now.toISOString(),
      verification_result: verificationData || 'Erro na verificação'
    }
  });

  console.log('✅ WEBHOOK: USUÁRIO ATIVADO COM SUCESSO!');
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🆕 WEBHOOK: Nova subscription criada:', subscription.id);
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

  // Buscar plano baseado no price_id
  const priceId = subscription.items.data[0]?.price?.id;
  const { data: plan } = await supabase
    .from('plans')
    .select('id, name')
    .eq('stripe_price_id_monthly', priceId)
    .single();

  console.log('📦 WEBHOOK: Plano encontrado para subscription:', plan?.name || 'Desconhecido');

  // Atualizar assinatura com dados detalhados
  const subscriptionData = {
    user_id: customerData.user_id,
    plan_id: plan?.id || null,
    status: subscription.status === 'active' ? 'active' as const : 'canceled' as const,
    trial_ends_at: null, // SEMPRE LIMPAR TRIAL
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