const stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  console.log('🎯 NETLIFY WEBHOOK: Stripe webhook recebido');
  
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    // Get Stripe configuration from database
    const { data: stripeConfig, error: configError } = await supabase
      .from('payment_gateways')
      .select('secret_key_encrypted, webhook_secret')
      .eq('gateway_name', 'stripe')
      .single();

    if (configError || !stripeConfig) {
      console.error('❌ WEBHOOK: Stripe não configurado:', configError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Stripe não configurado' })
      };
    }

    console.log('✅ WEBHOOK: Configuração do Stripe encontrada');

    const stripeClient = stripe(stripeConfig.secret_key_encrypted);

    // Get the signature from the header
    const signature = event.headers['stripe-signature'];
    if (!signature) {
      console.error('❌ WEBHOOK: Assinatura não encontrada');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Assinatura não encontrada' })
      };
    }

    // Verify the webhook signature
    let stripeEvent;
    try {
      stripeEvent = stripeClient.webhooks.constructEvent(
        event.body,
        signature,
        stripeConfig.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log('✅ WEBHOOK: Assinatura verificada com sucesso');
    } catch (error) {
      console.error('❌ WEBHOOK: Falha na verificação da assinatura:', error.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Falha na verificação: ${error.message}` })
      };
    }

    console.log('🎯 WEBHOOK: Processando evento:', stripeEvent.type);

    // Process the event
    if (stripeEvent.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(stripeEvent.data.object);
    } else if (stripeEvent.type === 'customer.subscription.created') {
      await handleSubscriptionCreated(stripeEvent.data.object);
    } else if (stripeEvent.type === 'customer.subscription.updated') {
      await handleSubscriptionUpdated(stripeEvent.data.object);
    } else if (stripeEvent.type === 'customer.subscription.deleted') {
      await handleSubscriptionCanceled(stripeEvent.data.object);
    } else {
      console.log(`⚠️ WEBHOOK: Evento não tratado: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('❌ WEBHOOK: Erro crítico:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function handleCheckoutCompleted(session) {
  console.log('💳 WEBHOOK: Processando checkout completado:', session.id);
  
  const customerId = session.customer;
  
  console.log('📊 WEBHOOK: Dados do checkout:', {
    customer_id: customerId,
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
    status: 'active', // FORÇAR ATIVO
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

  // Criar log de auditoria detalhado
  await supabase.from('audit_logs').insert({
    actor_id: null,
    actor_email: 'stripe_webhook',
    action: 'SUBSCRIPTION_ACTIVATED_CHECKOUT',
    details: {
      user_id: userId,
      customer_id: customerId,
      session_id: session.id,
      plan_name: activePlan?.name || 'Plano Padrão',
      payment_status: session.payment_status,
      mode: session.mode,
      activated_at: now.toISOString()
    }
  });

  console.log('✅ WEBHOOK: USUÁRIO ATIVADO COM SUCESSO!');
}

async function handleSubscriptionCreated(subscription) {
  console.log('🆕 WEBHOOK: Nova subscription criada:', subscription.id);
  await handleSubscriptionUpdated(subscription);
}

async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 WEBHOOK: Subscription atualizada:', subscription.id);
  
  const customerId = subscription.customer;
  
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
    status: subscription.status === 'active' ? 'active' : 'canceled',
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

async function handleSubscriptionCanceled(subscription) {
  console.log('❌ WEBHOOK: Subscription cancelada:', subscription.id);
  
  const customerId = subscription.customer;
  
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