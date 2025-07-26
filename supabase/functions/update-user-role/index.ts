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
      .select('role')
      .eq('id', user.id)
      .single();

    // Debug: Log detalhado do perfil do usuário
    console.log('🔍 DEBUG - Verificação de admin:');
    console.log('- User ID:', user.id);
    console.log('- User Email:', user.email);
    console.log('- Admin Profile Data:', adminProfile);
    console.log('- Admin Error:', adminError);
    console.log('- Role encontrado:', adminProfile?.role);

    if (adminError || adminProfile?.role !== 'admin') {
      console.log('❌ ACESSO NEGADO - Detalhes:');
      console.log('- adminError:', adminError);
      console.log('- role atual:', adminProfile?.role);
      console.log('- role esperado: admin');
      return corsResponse({ error: 'Acesso negado - apenas administradores' }, 403);
    }

    // Extrair dados da requisição
    const { user_id, new_role } = await req.json();

    if (!user_id || !new_role) {
      return corsResponse({ error: 'user_id e new_role são obrigatórios' }, 400);
    }

    if (!['coach', 'admin'].includes(new_role)) {
      return corsResponse({ error: 'Função inválida. Use "coach" ou "admin"' }, 400);
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

    // Verificar se há mudança real
    if (targetUser.role === new_role) {
      return corsResponse({ 
        success: true, 
        message: 'Usuário já possui esta função',
        no_change: true 
      });
    }

    // Atualizar função do usuário
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update({ role: new_role })
      .eq('id', user_id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar função do usuário:', updateError);
      return corsResponse({ error: 'Erro ao atualizar função do usuário' }, 500);
    }

    // Criar log de auditoria
    const auditDetails = {
      target_user_id: user_id,
      target_user_email: targetUser.email,
      target_user_name: targetUser.full_name,
      old_role: targetUser.role,
      new_role: new_role,
      timestamp: new Date().toISOString()
    };

    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'USER_ROLE_UPDATED',
        details: auditDetails
      });

    if (auditError) {
      console.error('Erro ao criar log de auditoria:', auditError);
      // Não falhar a operação por causa do log
    }

    return corsResponse({
      success: true,
      message: `Função do usuário atualizada de "${targetUser.role}" para "${new_role}"`,
      updated_user: updatedUser,
      audit_details: auditDetails
    });

  } catch (error: any) {
    console.error('Erro na atualização de função:', error);
    return corsResponse({ error: error.message }, 500);
  }
});