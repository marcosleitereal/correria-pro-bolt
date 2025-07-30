const stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Logs iniciais para debugging
  console.log('🎯 WEBHOOK INICIADO:', {
    timestamp: new Date().toISOString(),
    method: event.httpMethod,
    headers: Object.keys(event.headers || {}),
    bodyLength: event.body?.length || 0
  });

  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ WEBHOOK: Respondendo OPTIONS');
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    console.log('❌ WEBHOOK: Método não permitido:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    // VERIFICAÇÃO CRÍTICA DE VARIÁVEIS DE AMBIENTE
    console.log('🔍 WEBHOOK: Verificando variáveis de ambiente...');
    
    const requiredEnvVars = {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET
    };

    const missingVars = [];
    for (const [name, value] of Object.entries(requiredEnvVars)) {
      if (!value) {
        missingVars.push(name);
      } else {
        console.log(`✅ ${name}: ${name.includes('SECRET') || name.includes('KEY') ? 'CONFIGURADA' : value.substring(0, 20) + '...'}`);
      }
    }

    if (missingVars.length > 0) {
      const errorMsg = `Variáveis de ambiente ausentes: ${missingVars.join(', ')}`;
      console.error('❌ WEBHOOK:', errorMsg);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: errorMsg,
          missing_vars: missingVars,
          timestamp: new Date().toISOString()
        })
      };
    }

    console.log('✅ WEBHOOK: Todas as variáveis de ambiente estão configuradas');

    // INICIALIZAR CLIENTES
    console.log('🔧 WEBHOOK: Inicializando clientes...');
    
    let supabase, stripeClient;
    
    try {
      // Initialize Supabase client
      supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      console.log('✅ WEBHOOK: Cliente Supabase inicializado');

      // Initialize Stripe client
      stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
      console.log('✅ WEBHOOK: Cliente Stripe inicializado');
    } catch (initError) {
      console.error('❌ WEBHOOK: Erro ao inicializar clientes:', initError);
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
    console.log('🔐 WEBHOOK: Verificando assinatura...');
    
    const signature = event.headers['stripe-signature'];
    if (!signature) {
      console.error('❌ WEBHOOK: Assinatura não encontrada nos headers');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Assinatura não encontrada' })
      };
    }

    console.log('✅ WEBHOOK: Assinatura encontrada');

    // CONSTRUIR E VERIFICAR EVENTO
    let stripeEvent;
    try {
      stripeEvent = stripeClient.webhooks.constructEvent(
        event.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log('✅ WEBHOOK: Evento verificado com sucesso:', {
        type: stripeEvent.type,
        id: stripeEvent.id,
        created: stripeEvent.created
      });
    } catch (verifyError) {
      console.error('❌ WEBHOOK: Falha na verificação da assinatura:', {
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
    console.log('🎯 WEBHOOK: Processando evento:', stripeEvent.type);

    if (stripeEvent.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(stripeEvent.data.object, supabase);
    } else if (stripeEvent.type === 'customer.subscription.created') {
      await handleSubscriptionCreated(stripeEvent.data.object, supabase);
    } else if (stripeEvent.type === 'customer.subscription.updated') {
      await handleSubscriptionUpdated(stripeEvent.data.object, supabase);
    } else if (stripeEvent.type === 'customer.subscription.deleted') {
      await handleSubscriptionCanceled(stripeEvent.data.object, supabase);
    } else {
      console.log(`⚠️ WEBHOOK: Evento não tratado: ${stripeEvent.type}`);
    }

    console.log('✅ WEBHOOK: Evento processado com sucesso');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        received: true,
        event_type: stripeEvent.type,
        event_id: stripeEvent.id,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ WEBHOOK: Erro crítico:', {
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
        timestamp: new Date().toISOString()
      })
    };
  }
};

async function handleCheckoutCompleted(session, supabase) {
  console.log('💳 WEBHOOK: Processando checkout completado:', {
    session_id: session.id,
    customer_id: session.customer,
    payment_status: session.payment_status,
    mode: session.mode
  });
  
  const customerId = session.customer;
  
  if (!customerId) {
    console.error('❌ WEBHOOK: Customer ID não encontrado no session');
    throw new Error('Customer ID não encontrado');
  }

  try {
    // BUSCAR USUÁRIO PELO CUSTOMER ID
    console.log('🔍 WEBHOOK: Buscando usuário para customer:', customerId);
    
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', customerId)
      .single();

    if (customerError) {
      console.error('❌ WEBHOOK: Erro ao buscar customer:', customerError);
      throw new Error(`Erro ao buscar customer: ${customerError.message}`);
    }

    if (!customerData) {
      console.error('❌ WEBHOOK: Customer não encontrado na base de dados:', customerId);
      throw new Error('Customer não encontrado na base de dados');
    }

    const userId = customerData.user_id;
    console.log('👤 WEBHOOK: Usuário encontrado:', userId);

    // BUSCAR PLANO ATIVO PARA ATIVAÇÃO
    console.log('📦 WEBHOOK: Buscando plano ativo...');
    
    const { data: activePlan, error: planError } = await supabase
      .from('plans')
      .select('id, name, price_monthly')
      .eq('is_active', true)
      .neq('name', 'Restrito')
      .order('price_monthly', { ascending: true })
      .limit(1)
      .single();

    if (planError) {
      console.warn('⚠️ WEBHOOK: Erro ao buscar plano ativo:', planError);
      console.log('🔄 WEBHOOK: Continuando sem plano específico...');
    } else {
      console.log('✅ WEBHOOK: Plano encontrado:', activePlan.name);
    }

    // CRÍTICO: LIMPEZA TOTAL DO ESTADO ANTERIOR
    console.log('🗑️ WEBHOOK: Limpando qualquer estado anterior...');
    await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);
    
    console.log('✅ WEBHOOK: Estado anterior limpo');

    // ATIVAR USUÁRIO COM ESTADO LIMPO
    console.log('🚀 WEBHOOK: ATIVANDO USUÁRIO COM PLANO PAGO...');
    
    const now = new Date();
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 ano de acesso

    const subscriptionData = {
      user_id: userId,
      plan_id: activePlan?.id || null,
      status: 'active', // FORÇAR ATIVO
      trial_ends_at: null, // LIMPAR TRIAL
      current_period_start: now.toISOString(),
      current_period_end: oneYearLater.toISOString(),
      updated_at: now.toISOString()
    };

    console.log('💾 WEBHOOK: Dados da ativação:', {
      user_id: userId,
      plan_name: activePlan?.name || 'Sem plano específico',
      status: 'active',
      trial_cleared: true,
      period_end: oneYearLater.toLocaleDateString('pt-BR')
    });

    // CRIAR NOVA ASSINATURA ATIVA
    console.log('💾 WEBHOOK: Criando assinatura ativa...');
    const { data: activatedSub, error: activationError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (activationError) {
      console.error('❌ WEBHOOK: ERRO CRÍTICO na ativação:', activationError);
      throw new Error(`Falha crítica na ativação: ${activationError.message}`);
    }
    
    console.log('✅ WEBHOOK: Ativação bem-sucedida:', activatedSub);
    
    // VERIFICAÇÃO FINAL - CONFIRMAR ATIVAÇÃO
    console.log('🔍 WEBHOOK: Verificação final da ativação...');
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('subscriptions')
      .select('status, trial_ends_at, plan_id')
      .eq('user_id', userId)
      .single();
    
    if (finalError) {
      console.error('❌ WEBHOOK: Erro na verificação final:', finalError);
    } else {
      console.log('🔍 WEBHOOK: Verificação final resultado:', {
        status: finalCheck.status,
        trial_ends_at: finalCheck.trial_ends_at,
        plan_id: finalCheck.plan_id
      });
      
      if (finalCheck.status !== 'active' || finalCheck.trial_ends_at !== null) {
        console.error('❌ WEBHOOK: ATIVAÇÃO FALHOU - estado incorreto');
        throw new Error('Ativação não foi aplicada corretamente');
      }
    }

    // VERIFICAÇÃO PÓS-ATIVAÇÃO
    console.log('🔍 WEBHOOK: Verificando ativação...');
    
    const { data: verificationData, error: verificationError } = await supabase
      .from('user_subscription_details')
      .select('subscription_status, has_access, current_plan_name')
      .eq('user_id', userId)
      .single();

    if (verificationError) {
      console.warn('⚠️ WEBHOOK: Erro na verificação:', verificationError);
    } else {
      console.log('✅ WEBHOOK: Verificação pós-ativação:', {
        subscription_status: verificationData.subscription_status,
        has_access: verificationData.has_access,
        current_plan_name: verificationData.current_plan_name
      });
    }

    // LOG DE AUDITORIA DETALHADO
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
        activated_at: now.toISOString(),
        period_end: oneYearLater.toISOString(),
        verification_result: verificationData || 'Erro na verificação'
      }
    });

    console.log('🎉 WEBHOOK: USUÁRIO ATIVADO COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ WEBHOOK: Erro no processamento do checkout:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(subscription, supabase) {
  console.log('🆕 WEBHOOK: Nova subscription criada:', subscription.id);
  await handleSubscriptionUpdated(subscription, supabase);
}

async function handleSubscriptionUpdated(subscription, supabase) {
  console.log('🔄 WEBHOOK: Subscription atualizada:', {
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

    console.log('📦 WEBHOOK: Plano encontrado:', plan?.name || 'Desconhecido');

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
      console.error('❌ WEBHOOK: Erro ao atualizar subscription:', updateError);
    } else {
      console.log('✅ WEBHOOK: Subscription atualizada:', subscription.status);
    }
  } catch (error) {
    console.error('❌ WEBHOOK: Erro no handleSubscriptionUpdated:', error);
  }
}

async function handleSubscriptionCanceled(subscription, supabase) {
  console.log('❌ WEBHOOK: Subscription cancelada:', subscription.id);
  
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

    console.log('✅ WEBHOOK: Subscription cancelada para usuário:', customerData.user_id);
  } catch (error) {
    console.error('❌ WEBHOOK: Erro no handleSubscriptionCanceled:', error);
  }
}