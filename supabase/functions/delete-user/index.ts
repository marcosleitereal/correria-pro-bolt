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
    const { user_id } = await req.json();

    if (!user_id) {
      return corsResponse({ error: 'user_id é obrigatório' }, 400);
    }

    // Tentar buscar dados do usuário para validação e auditoria
    const { data: targetUser, error: targetError } = await supabase
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', user_id)
      .single();

    // Se não encontrou o perfil, ainda tenta buscar o usuário na autenticação
    let userEmail = null;
    let userName = null;
    let userRole = null;

    if (targetError || !targetUser) {
      console.warn('Perfil não encontrado na tabela profiles, tentando buscar na autenticação:', targetError?.message);
      
      // Tentar buscar o usuário diretamente na autenticação
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user_id);
      
      if (authError || !authUser.user) {
        return corsResponse({ error: 'Usuário não encontrado no sistema de autenticação' }, 404);
      }
      
      userEmail = authUser.user.email || 'email_desconhecido';
      userName = authUser.user.user_metadata?.full_name || 'nome_desconhecido';
      userRole = 'role_desconhecido';
    } else {
      // Validar se é um coach (apenas se temos dados do perfil)
      if (targetUser.role !== 'coach') {
        return corsResponse({ error: 'Apenas treinadores podem ser excluídos por esta função' }, 400);
      }
      
      userEmail = targetUser.email;
      userName = targetUser.full_name;
      userRole = targetUser.role;
    }

    // Verificar se não está tentando excluir a si mesmo
    if (user_id === user.id) {
      return corsResponse({ error: 'Você não pode excluir sua própria conta' }, 400);
    }

    // Excluir usuário usando admin API (isso remove da autenticação)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error('Erro ao excluir usuário:', deleteError);
      return corsResponse({ error: 'Erro ao excluir usuário: ' + deleteError.message }, 500);
    }

    console.log('✅ Usuário excluído da autenticação com sucesso');

    // Limpar dados relacionados (CASCADE deve fazer isso automaticamente)
    try {
      // Excluir perfil se existir (isso acionará CASCADE para outros dados)
      await supabase.from('profiles').delete().eq('id', user_id);
      
      // Excluir assinatura se existir (pode não existir)
      await supabase.from('subscriptions').delete().eq('user_id', user_id);
      
      // Excluir dados de runners se existir
      await supabase.from('runners').delete().eq('coach_id', user_id);
      
      // Excluir grupos de treino se existir
      await supabase.from('training_groups').delete().eq('coach_id', user_id);
      
      // Excluir treinos se existir
      await supabase.from('trainings').delete().eq('coach_id', user_id);
      
      console.log('✅ Dados relacionados limpos com sucesso');
    } catch (cleanupError) {
      console.warn('Erro na limpeza de dados relacionados (não crítico):', cleanupError);
    }

    // Criar log de auditoria
    const auditDetails = {
      deleted_user_id: user_id,
      deleted_user_email: userEmail,
      deleted_user_name: userName,
      deleted_user_role: userRole,
      timestamp: new Date().toISOString()
    };

    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'USER_DELETED',
        details: auditDetails
      });

    if (auditError) {
      console.error('Erro ao criar log de auditoria:', auditError);
      // Não falhar a operação por causa do log
    }

    return corsResponse({
      success: true,
      message: `Usuário ${userName} (${userEmail}) foi excluído com sucesso`,
      audit_details: auditDetails
    });

  } catch (error: any) {
    console.error('Erro na exclusão de usuário:', error);
    return corsResponse({ error: error.message }, 500);
  }
});