import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!, 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Buscar configuração do Stripe
    const { data: stripeConfig, error: configError } = await supabase
      .from('payment_gateways')
      .select('secret_key_encrypted, webhook_secret')
      .eq('gateway_name', 'stripe')
      .single();

    if (configError || !stripeConfig) {
      return new Response('Stripe não configurado', { status: 500 });
    }

    const stripe = new Stripe(stripeConfig.secret_key_encrypted, {
      appInfo: {
        name: 'Correria.Pro',
        version: '1.0.0',
      },
    });

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body, 
        signature, 
        stripeConfig.webhook_secret || Deno.env.get('STRIPE_WEBHOOK_SECRET')!
      );
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  try {
    console.log(`Processando evento: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    } else if (event.type === 'customer.subscription.updated') {
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
    } else if (event.type === 'customer.subscription.deleted') {
      await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
    } else if (event.type === 'invoice.payment_failed') {
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
    }
  } catch (error) {
    console.error('Erro ao processar evento do webhook:', error);
    throw error;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;
  
  if (!userId) {
    console.error('User ID não encontrado nos metadados da sessão');
    return;
  }

  // Buscar dados da assinatura
  const { data: stripeConfig } = await supabase
    .from('payment_gateways')
    .select('secret_key_encrypted')
    .eq('gateway_name', 'stripe')
    .single();

  if (!stripeConfig) {
    console.error('Configuração do Stripe não encontrada');
    return;
  }

  const stripe = new Stripe(stripeConfig.secret_key_encrypted);
  
  // Buscar assinatura do Stripe
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    console.error('Assinatura ativa não encontrada');
    return;
  }

  const subscription = subscriptions.data[0];
  
  // Buscar plano baseado no price_id
  const { data: plan } = await supabase
    .from('plans')
    .select('name')
    .eq('stripe_price_id', subscription.items.data[0].price.id)
    .single();

  // Atualizar assinatura do usuário
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      plan_name: plan?.name || 'unknown',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_ends_at: null, // Limpar trial ao ativar
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('Erro ao atualizar assinatura:', updateError);
    throw updateError;
  }

  console.log(`Assinatura ativada para usuário ${userId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Buscar usuário pelo customer_id
  const { data: userSub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', subscription.customer)
    .single();

  if (!userSub) {
    console.error('Usuário não encontrado para customer:', subscription.customer);
    return;
  }

  // Atualizar dados da assinatura
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status === 'active' ? 'active' : 'canceled',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('user_id', userSub.user_id);

  if (updateError) {
    console.error('Erro ao atualizar assinatura:', updateError);
    throw updateError;
  }

  console.log(`Assinatura atualizada para usuário ${userSub.user_id}`);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  // Buscar usuário pelo customer_id
  const { data: userSub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', subscription.customer)
    .single();

  if (!userSub) {
    console.error('Usuário não encontrado para customer:', subscription.customer);
    return;
  }

  // Cancelar assinatura
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
    })
    .eq('user_id', userSub.user_id);

  if (updateError) {
    console.error('Erro ao cancelar assinatura:', updateError);
    throw updateError;
  }

  console.log(`Assinatura cancelada para usuário ${userSub.user_id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Lógica para lidar com falha de pagamento
  // Por enquanto, apenas log
  console.log(`Pagamento falhou para customer: ${invoice.customer}`);
}