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
    const { full_name, email, password } = await req.json();

    if (!full_name || !email || !password) {
      return corsResponse({ error: 'Nome completo, email e senha são obrigatórios' }, 400);
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return corsResponse({ error: 'Formato de email inválido' }, 400);
    }

    // Validar senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return corsResponse({ error: 'Senha deve ter pelo menos 6 caracteres' }, 400);
    }

    // Verificar se email já existe
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const emailExists = existingUser.users.some(u => u.email === email);
    
    if (emailExists) {
      return corsResponse({ error: 'Este email já está cadastrado na plataforma' }, 409);
    }

    // Criar usuário usando admin API
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        full_name: full_name
      }
    });

    if (createError) {
      console.error('Erro ao criar usuário:', createError);
      return corsResponse({ error: 'Erro ao criar usuário: ' + createError.message }, 500);
    }

    if (!newUser.user) {
      return corsResponse({ error: 'Falha ao criar usuário - dados não retornados' }, 500);
    }

    // Buscar configurações da aplicação para o período de teste
    console.log('📊 CREATE-USER: Buscando configurações do Painel Admin...');
    const { data: appSettings, error: settingsError } = await supabase
      .from('app_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.error('❌ CREATE-USER: ERRO CRÍTICO ao buscar configurações do Painel Admin:', settingsError);
      // Se houver erro, usar valores padrão mas continuar
      console.warn('⚠️ CREATE-USER: Usando valores padrão devido ao erro:', settingsError);
    }

    if (!appSettings) {
      console.warn('⚠️ CREATE-USER: Nenhuma configuração encontrada, criando configuração padrão...');
      
      // Criar configuração padrão se não existir
      const { data: defaultSettings, error: createError } = await supabase
        .from('app_settings')
        .insert({
          trial_duration_days: 70,
          trial_athlete_limit: 70,
          trial_training_limit: 70,
          updated_by: user.id
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ CREATE-USER: Erro ao criar configuração padrão:', createError);
        // Usar valores hardcoded como último recurso
        const trialDurationDays = 70;
        const trialAthleteLimit = 70;
        const trialTrainingLimit = 70;
        
        console.log('🆘 CREATE-USER: Usando valores de emergência:', {
          trial_duration_days: trialDurationDays,
          trial_athlete_limit: trialAthleteLimit,
          trial_training_limit: trialTrainingLimit
        });
      } else {
        console.log('✅ CREATE-USER: Configuração padrão criada:', defaultSettings);
        // Usar a configuração recém-criada
        const trialDurationDays = defaultSettings.trial_duration_days;
        const trialAthleteLimit = defaultSettings.trial_athlete_limit;
        const trialTrainingLimit = defaultSettings.trial_training_limit;
      }
    } else {
      // CRÍTICO: USAR SEMPRE os valores do Painel Admin (NUNCA valores padrão hardcoded)
      const trialDurationDays = appSettings.trial_duration_days;
      const trialAthleteLimit = appSettings.trial_athlete_limit;
      const trialTrainingLimit = appSettings.trial_training_limit;

      console.log('✅ CREATE-USER: Configurações do Painel Admin carregadas (VALORES REAIS):', {
        trial_duration_days: trialDurationDays,
        trial_athlete_limit: trialAthleteLimit,
        trial_training_limit: trialTrainingLimit,
        fonte: 'app_settings (Painel Admin)',
        updated_at: appSettings.updated_at,
        timestamp_busca: new Date().toISOString()
      });

      // Calcular data de fim do período de teste
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDurationDays);

      console.log('✅ CREATE-USER: Criando perfil manualmente para garantir consistência...');
      
      // Criar perfil manualmente SEMPRE (não depender do trigger)
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: newUser.user.id,
          full_name: full_name,
          email: email,
          role: 'coach'
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ CREATE-USER: Erro ao criar perfil:', profileError);
        return corsResponse({ error: 'Erro ao criar perfil do usuário' }, 500);
      }

      console.log('✅ CREATE-USER: Perfil criado com sucesso:', newProfile);

      // CRÍTICO: Criar assinatura de período de teste SEMPRE
      console.log('✅ CREATE-USER: Criando assinatura de trial com duração de', trialDurationDays, 'dias...');
      const { data: newSubscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: newUser.user.id,
          plan_id: null, // Sem plano específico durante o trial
          status: 'trialing',
          trial_ends_at: trialEndsAt.toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: trialEndsAt.toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (subscriptionError) {
        console.error('❌ CREATE-USER: ERRO CRÍTICO ao criar assinatura de trial:', subscriptionError);
        return corsResponse({ error: 'Erro ao criar período de teste para o usuário' }, 500);
      } else {
        console.log('✅ CREATE-USER: Assinatura de trial criada com sucesso:', newSubscription);
      }

      // Criar log de auditoria
      const auditDetails = {
        created_user_id: newUser.user.id,
        created_user_email: email,
        created_user_name: full_name,
        created_user_role: 'coach',
        trial_duration_days: trialDurationDays,
        trial_ends_at: trialEndsAt.toISOString(),
        trial_athlete_limit: trialAthleteLimit,
        trial_training_limit: trialTrainingLimit,
        timestamp: new Date().toISOString()
      };

      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          actor_id: user.id,
          actor_email: user.email,
          action: 'USER_CREATED',
          details: auditDetails
        });

      if (auditError) {
        console.error('Erro ao criar log de auditoria:', auditError);
        // Não falhar a operação por causa do log
      }

      return corsResponse({
        success: true,
        message: `Treinador ${full_name} (${email}) foi criado com sucesso`,
        trial_info: {
          status: 'trialing',
          duration_days: trialDurationDays,
          ends_at: trialEndsAt.toISOString(),
          athlete_limit: trialAthleteLimit,
          training_limit: trialTrainingLimit
        },
        user_id: newUser.user.id,
        audit_details: auditDetails
      });
    }

  } catch (error: any) {
    console.error('Erro na criação de usuário:', error);
    return corsResponse({ error: error.message }, 500);
  }
});