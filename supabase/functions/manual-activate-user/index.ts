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

    const { user_email } = await req.json();

    if (!user_email) {
      return corsResponse({ error: 'user_email é obrigatório' }, 400);
    }

    console.log('🔧 MANUAL ACTIVATION: Ativando usuário:', user_email);

    // Buscar usuário pelo email
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', user_email)
      .single();

    if (profileError || !targetProfile) {
      return corsResponse({ error: 'Usuário não encontrado' }, 404);
    }

    // Buscar plano "Tiro Livre" (ou primeiro plano ativo)
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name')
      .eq('is_active', true)
      .neq('name', 'Restrito')
      .order('price_monthly', { ascending: true })
      .limit(1)
      .single();

    if (planError || !plan) {
      return corsResponse({ error: 'Nenhum plano ativo encontrado' }, 404);
    }

    console.log('✅ MANUAL ACTIVATION: Plano encontrado:', plan.name);

    // Ativar assinatura
    const { data: updatedSub, error: updateError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: targetProfile.id,
        plan_id: plan.id,
        status: 'active',
        trial_ends_at: null,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (updateError) {
      console.error('❌ MANUAL ACTIVATION: Erro ao ativar:', updateError);
      return corsResponse({ error: 'Erro ao ativar usuário' }, 500);
    }

    console.log('✅ MANUAL ACTIVATION: Usuário ativado com sucesso!');

    // Criar log de auditoria
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'MANUAL_USER_ACTIVATION',
      details: {
        target_user_id: targetProfile.id,
        target_user_email: user_email,
        target_user_name: targetProfile.full_name,
        activated_plan: plan.name,
        activated_at: new Date().toISOString()
      }
    });

    return corsResponse({
      success: true,
      message: `Usuário ${targetProfile.full_name} (${user_email}) foi ativado no plano ${plan.name}`,
      subscription: updatedSub
    });

  } catch (error: any) {
    console.error('❌ MANUAL ACTIVATION: Erro geral:', error);
    return corsResponse({ error: error.message }, 500);
  }
});