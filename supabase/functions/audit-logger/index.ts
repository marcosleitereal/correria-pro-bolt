import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!, 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface AuditLogEntry {
  actor_id?: string;
  actor_email?: string;
  action: string;
  details?: Record<string, any>;
}

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

    // Verificar se é admin (apenas admins podem criar logs via esta função)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.email !== 'dev@sonnik.com.br') {
      return corsResponse({ error: 'Acesso negado - apenas administradores' }, 403);
    }

    // Extrair dados do log
    const logData: AuditLogEntry = await req.json();

    if (!logData.action) {
      return corsResponse({ error: 'Campo "action" é obrigatório' }, 400);
    }

    // Inserir log de auditoria
    const { data, error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        actor_id: logData.actor_id || user.id,
        actor_email: logData.actor_email || user.email,
        action: logData.action,
        details: logData.details || {}
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir log de auditoria:', insertError);
      return corsResponse({ error: 'Erro ao criar log de auditoria' }, 500);
    }

    return corsResponse({ 
      success: true, 
      log_id: data.id,
      message: 'Log de auditoria criado com sucesso'
    });

  } catch (error: any) {
    console.error('Erro na função de auditoria:', error);
    return corsResponse({ error: error.message }, 500);
  }
});