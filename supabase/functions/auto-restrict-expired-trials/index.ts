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

    console.log('🔄 AUTO-RESTRICT: Verificando trials expirados...');

    // Buscar plano restrito
    const { data: restrictedPlan, error: planError } = await supabase
      .from('plans')
      .select('id')
      .eq('name', 'Restrito')
      .single();

    if (planError || !restrictedPlan) {
      console.error('❌ AUTO-RESTRICT: Plano "Restrito" não encontrado no banco');
      console.log('💡 AUTO-RESTRICT: Certifique-se de que existe um plano com nome exato "Restrito"');
      return corsResponse({ 
        error: 'Plano "Restrito" não encontrado',
        suggestion: 'Crie um plano com nome "Restrito" na tabela plans'
      }, 500);
    }

    console.log('✅ AUTO-RESTRICT: Plano "Restrito" encontrado');

    // Buscar trials expirados que ainda não foram movidos para restrito
    const { data: expiredTrials, error: trialsError } = await supabase
      .from('subscriptions')
      .select('user_id, trial_ends_at')
      .eq('status', 'trialing')
      .lt('trial_ends_at', new Date().toISOString())
      .neq('plan_id', restrictedPlan.id);

    if (trialsError) {
      console.error('❌ AUTO-RESTRICT: Erro ao buscar trials expirados:', trialsError);
      return corsResponse({ error: 'Erro ao buscar trials expirados' }, 500);
    }

    console.log(`📊 AUTO-RESTRICT: ${expiredTrials?.length || 0} trials expirados encontrados`);

    if (!expiredTrials || expiredTrials.length === 0) {
      return corsResponse({ 
        message: 'Nenhum trial expirado encontrado',
        processed: 0 
      });
    }

    let processedCount = 0;
    const errors = [];

    // Processar cada trial expirado
    for (const trial of expiredTrials) {
      try {
        console.log(`🔄 AUTO-RESTRICT: Movendo usuário para plano restrito...`);

        // Mover para plano restrito
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            plan_id: restrictedPlan.id,
            status: 'active', // Ativo no plano restrito
            trial_ends_at: null, // Limpar trial
            updated_at: new Date().toISOString()
          })
          .eq('user_id', trial.user_id);

        if (updateError) {
          console.error(`❌ AUTO-RESTRICT: Erro ao mover usuário:`, updateError);
          errors.push({ user_id: trial.user_id, error: updateError.message });
          continue;
        }

        // Criar log de auditoria
        const { error: auditError } = await supabase
          .from('audit_logs')
          .insert({
            actor_id: null,
            actor_email: 'system',
            action: 'TRIAL_EXPIRED_AUTO_RESTRICT',
            details: {
              user_id: trial.user_id,
              trial_ended_at: trial.trial_ends_at,
              moved_to_plan: 'Restrito',
              timestamp: new Date().toISOString()
            }
          });

        if (auditError) {
          console.error(`⚠️ AUTO-RESTRICT: Erro no log de auditoria:`, auditError);
        }

        processedCount++;
        console.log(`✅ AUTO-RESTRICT: Usuário movido para plano restrito`);

      } catch (error) {
        console.error(`❌ AUTO-RESTRICT: Erro geral:`, error);
        errors.push({ user_id: trial.user_id, error: error.message });
      }
    }

    console.log(`✅ AUTO-RESTRICT: ${processedCount} usuários movidos para plano restrito`);

    return corsResponse({
      message: `${processedCount} usuários movidos para plano restrito`,
      processed: processedCount,
      total_found: expiredTrials.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('❌ AUTO-RESTRICT: Erro geral:', error);
    return corsResponse({ error: error.message }, 500);
  }
});