import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
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
    if (req.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Método não permitido' }, 405);
    }

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return corsResponse({ error: 'Token de autorização necessário' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return corsResponse({ error: 'Falha na autenticação' }, 401);
    }

    // Verificar se é admin
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('id', user.id)
      .single();

    if (adminError || adminProfile?.email !== 'dev@sonnik.com.br' || adminProfile?.role !== 'admin') {
      return corsResponse({ error: 'Acesso negado - apenas administradores' }, 403);
    }

    // Extrair dados da requisição
    const { user_id, new_plan_id } = await req.json();

    if (!user_id || !new_plan_id) {
      return corsResponse({ error: 'user_id e new_plan_id são obrigatórios' }, 400);
    }

    // Buscar dados do usuário alvo
    const { data: targetUser, error: targetError } = await supabase
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', user_id)
      .single();

    if (targetError || !targetUser) {
      return corsResponse({ error: 'Usuário não encontrado' }, 404);
    }

    if (targetUser.role !== 'coach') {
      return corsResponse({ error: 'Apenas treinadores podem ter planos atribuídos' }, 400);
    }

    // Buscar dados do plano
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('name, price_monthly, max_athletes')
      .eq('id', new_plan_id)
      .single();

    if (planError || !plan) {
      return corsResponse({ error: 'Plano não encontrado' }, 404);
    }

    // Buscar assinatura atual
    const { data: currentSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    let subscriptionResult;

    if (currentSubscription) {
      // Atualizar assinatura existente
      const { data: updatedSub, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_id: new_plan_id,
          plan_name: plan.name,
          status: 'active',
          trial_ends_at: null,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSubscription.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      subscriptionResult = updatedSub;
    } else {
      // Criar nova assinatura
      const { data: newSub, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user_id,
          plan_id: new_plan_id,
          plan_name: plan.name,
          status: 'active',
          trial_ends_at: null,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      subscriptionResult = newSub;
    }

    // Criar log de auditoria
    const auditDetails = {
      target_user_id: user_id,
      target_user_email: targetUser.email,
      target_user_name: targetUser.full_name,
      old_plan: currentSubscription?.plan_name || 'Nenhum',
      new_plan: plan.name,
      new_plan_id: new_plan_id,
      plan_price: plan.price_monthly,
      max_athletes: plan.max_athletes,
      timestamp: new Date().toISOString()
    };

    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'PLAN_ASSIGNED',
        details: auditDetails
      });

    if (auditError) {
      console.error('Erro ao criar log de auditoria:', auditError);
      // Não falhar a operação por causa do log
    }

    return corsResponse({
      success: true,
      message: `Plano "${plan.name}" atribuído com sucesso ao treinador ${targetUser.full_name}`,
      subscription: subscriptionResult,
      audit_details: auditDetails
    });

  } catch (error: any) {
    console.error('Erro na atribuição de plano:', error);
    return corsResponse({ error: error.message }, 500);
  }
});