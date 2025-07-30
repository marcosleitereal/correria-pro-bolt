const stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Logs iniciais para debugging
  console.log('🎯 NETLIFY WEBHOOK: Função iniciada', {
    timestamp: new Date().toISOString(),
    method: event.httpMethod,
    headers: Object.keys(event.headers || {}),
    bodyLength: event.body?.length || 0,
    netlifyContext: context.functionName
  });

  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ NETLIFY WEBHOOK: Respondendo OPTIONS');
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    console.log('❌ NETLIFY WEBHOOK: Método não permitido:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    // VERIFICAÇÃO CRÍTICA DE VARIÁVEIS DE AMBIENTE
    console.log('🔍 NETLIFY WEBHOOK: Verificando variáveis de ambiente...');
    
    const requiredEnvVars = {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET
    };

    const missingVars = [];
    for (const [name, value] of Object.entries(requiredEnvVars)) {
      if (!value) {
        missingVars.push(name);
      } else {
        console.log(`✅ ${name}: CONFIGURADA (${value.length} chars)`);
      }
    }

    if (missingVars.length > 0) {
      const errorMsg = `❌ VARIÁVEIS AUSENTES: ${missingVars.join(', ')}`;
      console.error('❌ NETLIFY WEBHOOK:', errorMsg);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: errorMsg,
          missing_vars: missingVars,
          timestamp: new Date().toISOString(),
          function: 'netlify-stripe-webhook'
        })
      };
    }

    console.log('✅ NETLIFY WEBHOOK: Todas as variáveis de ambiente estão configuradas');

    // INICIALIZAR CLIENTES
    console.log('🔧 NETLIFY WEBHOOK: Inicializando clientes...');
    
    let supabase, stripeClient;
    
    try {
      // Initialize Supabase client
      supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      console.log('✅ NETLIFY WEBHOOK: Cliente Supabase inicializado');

      // Initialize Stripe client
      stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
      console.log('✅ NETLIFY WEBHOOK: Cliente Stripe inicializado');
    } catch (initError) {
      console.error('❌ NETLIFY WEBHOOK: Erro ao inicializar clientes:', initError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Erro na inicialização dos clientes',
          details: initError.message,
          timestamp: new Date().toISOString()
        })
      };
    }

    // VERIFICAR ASSINATURA DO WEBHOOK
    console.log('🔐 NETLIFY WEBHOOK: Verificando assinatura...');
    
    const signature = event.headers['stripe-signature'];
    if (!signature) {
      console.error('❌ NETLIFY WEBHOOK: Assinatura não encontrada nos headers');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Assinatura não encontrada' })
      };
    }

    console.log('✅ NETLIFY WEBHOOK: Assinatura encontrada');

    // CONSTRUIR E VERIFICAR EVENTO
    let stripeEvent;
    try {
      console.log('🔐 NETLIFY WEBHOOK: Verificando com webhook secret:', {
        hasSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        secretLength: process.env.STRIPE_WEBHOOK_SECRET?.length || 0,
        signatureLength: signature?.length || 0
      });
      
      stripeEvent = stripeClient.webhooks.constructEvent(
        event.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log('✅ NETLIFY WEBHOOK: Evento verificado com sucesso:', {
        type: stripeEvent.type,
        id: stripeEvent.id,
        created: stripeEvent.created
      });
    } catch (verifyError) {
      console.error('❌ NETLIFY WEBHOOK: Falha na verificação da assinatura:', {
        error: verifyError.message,
        signature: signature.substring(0, 20) + '...',
        bodyLength: event.body?.length
      });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: `Falha na verificação: ${verifyError.message}`,
          timestamp: new Date().toISOString()
        })
      };
    }

    // PROCESSAR EVENTO
    console.log('🎯 NETLIFY WEBHOOK: Processando evento:', stripeEvent.type);

    if (stripeEvent.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(stripeEvent.data.object, supabase);
    } else if (stripeEvent.type === 'customer.subscription.created') {
      await handleSubscriptionCreated(stripeEvent.data.object, supabase);
    } else if (stripeEvent.type === 'customer.subscription.updated') {
      await handleSubscriptionUpdated(stripeEvent.data.object, supabase);
    } else if (stripeEvent.type === 'customer.subscription.deleted') {
      await handleSubscriptionCanceled(stripeEvent.data.object, supabase);
    } else {
      console.log(`⚠️ NETLIFY WEBHOOK: Evento não tratado: ${stripeEvent.type}`);
    }

    console.log('✅ NETLIFY WEBHOOK: Evento processado com sucesso');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        received: true,
        event_type: stripeEvent.type,
        event_id: stripeEvent.id,
        timestamp: new Date().toISOString(),
        function: 'netlify-stripe-webhook'
      })
    };

  } catch (error) {
    console.error('❌ NETLIFY WEBHOOK: Erro crítico:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: error.message,
        timestamp: new Date().toISOString(),
        function: 'netlify-stripe-webhook'
      })
    };
  }
};

async function handleCheckoutCompleted(session, supabase) {
  console.log('💳 NETLIFY WEBHOOK: Processando checkout completado:', {
    session_id: session.id,
    customer_id: session.customer,
    payment_status: session.payment_status,
    mode: session.mode
  });
  
  const customerId = session.customer;
  
  if (!customerId) {
    console.error('❌ NETLIFY WEBHOOK: Customer ID não encontrado no session');
    throw new Error('Customer ID não encontrado');
  }

  try {
    // BUSCAR USUÁRIO PELO CUSTOMER ID
    console.log('🔍 NETLIFY WEBHOOK: Buscando usuário para customer:', customerId);
    
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', customerId)
      .single();

    if (customerError) {
      console.error('❌ NETLIFY WEBHOOK: Erro ao buscar customer:', customerError);
      throw new Error(`Erro ao buscar customer: ${customerError.message}`);
    }

    if (!customerData) {
      console.error('❌ NETLIFY WEBHOOK: Customer não encontrado na base de dados:', customerId);
      throw new Error('Customer não encontrado na base de dados');
    }

    const userId = customerData.user_id;
    console.log('👤 NETLIFY WEBHOOK: Usuário encontrado:', userId);

    // BUSCAR PLANO ATIVO PARA ATIVAÇÃO
    console.log('📦 NETLIFY WEBHOOK: Buscando plano ativo...');
    
    const { data: activePlan, error: planError } = await supabase
      .from('plans')
      .select('id, name, price_monthly')
      .eq('is_active', true)
      .neq('name', 'Restrito')
      .order('price_monthly', { ascending: true })
      .limit(1)
      .single();

    if (planError) {
      console.warn('⚠️ NETLIFY WEBHOOK: Erro ao buscar plano ativo:', planError);
      console.log('🔄 NETLIFY WEBHOOK: Continuando sem plano específico...');
    } else {
      console.log('✅ NETLIFY WEBHOOK: Plano encontrado:', activePlan.name);
    }

    // CRÍTICO: ATIVAÇÃO FORÇADA DO USUÁRIO
    console.log('🚀 NETLIFY WEBHOOK: ATIVANDO USUÁRIO IMEDIATAMENTE...');

    // ATIVAR USUÁRIO COM ESTADO LIMPO
    const now = new Date();
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 ano

    const subscriptionData = {
      user_id: userId,
      plan_id: activePlan?.id || null,
      status: 'active',
      trial_ends_at: null,
      current_period_start: now.toISOString(),
      current_period_end: oneYearLater.toISOString(),
      updated_at: now.toISOString()
    };

    console.log('💾 NETLIFY WEBHOOK: Dados da ativação:', {
      user_id: userId,
      plan_name: activePlan?.name || 'Sem plano específico',
      status: 'active',
      trial_cleared: true,
      period_end: oneYearLater.toLocaleDateString('pt-BR')
    });

    // ESTRATÉGIA ROBUSTA: DELETE + INSERT
    console.log('🗑️ NETLIFY WEBHOOK: Limpando estado anterior...');
    await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);
    
    console.log('💾 NETLIFY WEBHOOK: Inserindo nova assinatura ativa...');
    const { data: activatedSub, error: activationError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (activationError) {
      console.error('❌ NETLIFY WEBHOOK: Erro ao ativar usuário:', activationError);
      throw new Error(`Falha na ativação: ${activationError.message}`);
    }
    
    console.log('✅ NETLIFY WEBHOOK: Ativação bem-sucedida:', activatedSub);
    
    // VERIFICAÇÃO FINAL - CONFIRMAR ATIVAÇÃO
    console.log('🔍 NETLIFY WEBHOOK: Verificação final da ativação...');
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('user_subscription_details')
      .select('subscription_status, has_access, current_plan_name')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (finalError) {
      console.error('❌ NETLIFY WEBHOOK: Erro na verificação final:', finalError);
    } else {
      console.log('🔍 NETLIFY WEBHOOK: Verificação final resultado:', {
        subscription_status: finalCheck?.subscription_status,
        has_access: finalCheck?.has_access,
        current_plan_name: finalCheck?.current_plan_name
      });
      
      if (!finalCheck?.has_access || finalCheck?.subscription_status !== 'active') {
        console.error('❌ NETLIFY WEBHOOK: ATIVAÇÃO FALHOU - estado incorreto');
        console.error('❌ NETLIFY WEBHOOK: Dados finais:', finalCheck);
      }
    }

    // LOG DE AUDITORIA DETALHADO
    await supabase.from('audit_logs').insert({
      actor_id: null,
      actor_email: 'netlify_stripe_webhook',
      action: 'SUBSCRIPTION_ACTIVATED_CHECKOUT',
      details: {
        user_id: userId,
        customer_id: customerId,
        session_id: session.id,
        plan_name: activePlan?.name || 'Plano Padrão',
        payment_status: session.payment_status,
        mode: session.mode,
        activated_at: now.toISOString(),
        period_end: oneYearLater.toISOString(),
        function: 'netlify-stripe-webhook'
      }
    });

    console.log('🎉 NETLIFY WEBHOOK: USUÁRIO ATIVADO COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ NETLIFY WEBHOOK: Erro no processamento do checkout:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(subscription, supabase) {
  console.log('🆕 NETLIFY WEBHOOK: Nova subscription criada:', subscription.id);
  await handleSubscriptionUpdated(subscription, supabase);
}

async function handleSubscriptionUpdated(subscription, supabase) {
  console.log('🔄 NETLIFY WEBHOOK: Subscription atualizada:', {
    id: subscription.id,
    status: subscription.status,
    customer: subscription.customer
  });
  
  const customerId = subscription.customer;
  
  try {
    // Buscar usuário
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', customerId)
      .single();

    if (customerError || !customerData) {
      console.error('❌ NETLIFY WEBHOOK: Usuário não encontrado para customer:', customerId);
      return;
    }

    // Buscar plano baseado no price_id
    const priceId = subscription.items.data[0]?.price?.id;
    const { data: plan } = await supabase
      .from('plans')
      .select('id, name')
      .eq('stripe_price_id_monthly', priceId)
      .single();

    console.log('📦 NETLIFY WEBHOOK: Plano encontrado:', plan?.name || 'Desconhecido');

    // Atualizar assinatura
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
      console.error('❌ NETLIFY WEBHOOK: Erro ao atualizar subscription:', updateError);
    } else {
      console.log('✅ NETLIFY WEBHOOK: Subscription atualizada:', subscription.status);
    }
  } catch (error) {
    console.error('❌ NETLIFY WEBHOOK: Erro no handleSubscriptionUpdated:', error);
  }
}

async function handleSubscriptionCanceled(subscription, supabase) {
  console.log('❌ NETLIFY WEBHOOK: Subscription cancelada:', subscription.id);
  
  const customerId = subscription.customer;
  
  try {
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

    console.log('✅ NETLIFY WEBHOOK: Subscription cancelada para usuário:', customerData.user_id);
  } catch (error) {
    console.error('❌ NETLIFY WEBHOOK: Erro no handleSubscriptionCanceled:', error);
  }
}