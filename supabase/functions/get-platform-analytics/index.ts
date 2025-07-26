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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    if (req.method !== 'GET') {
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

    console.log('📊 Iniciando coleta de métricas da plataforma...');

    // 1. Total de Treinadores
    const { count: totalCoaches, error: coachesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'coach');

    if (coachesError) {
      console.error('Erro ao contar treinadores:', coachesError);
      throw new Error('Erro ao calcular total de treinadores');
    }

    // 2. Novos Treinadores Hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: newCoachesToday, error: newCoachesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'coach')
      .gte('created_at', today.toISOString());

    if (newCoachesError) {
      console.error('Erro ao contar novos treinadores:', newCoachesError);
      throw new Error('Erro ao calcular novos treinadores');
    }

    // 3. Total de Atletas
    const { count: totalAthletes, error: athletesError } = await supabase
      .from('runners')
      .select('*', { count: 'exact', head: true })
      .eq('is_archived', false);

    if (athletesError) {
      console.error('Erro ao contar atletas:', athletesError);
      throw new Error('Erro ao calcular total de atletas');
    }

    // 4. Total de Treinos Gerados
    const { count: totalTrainingsGenerated, error: trainingsError } = await supabase
      .from('trainings')
      .select('*', { count: 'exact', head: true });

    if (trainingsError) {
      console.error('Erro ao contar treinos:', trainingsError);
      throw new Error('Erro ao calcular total de treinos');
    }

    // 5. Receita Mensal Recorrente (MRR)
    const { data: mrrData, error: mrrError } = await supabase
      .from('subscriptions')
      .select(`
        plans!inner(price_monthly)
      `)
      .eq('status', 'active');

    let monthlyRecurringRevenue = 0;
    if (mrrError) {
      console.error('Erro ao calcular MRR:', mrrError);
    } else if (mrrData) {
      monthlyRecurringRevenue = mrrData.reduce((sum, sub) => {
        return sum + (sub.plans?.price_monthly || 0);
      }, 0);
    }

    // 6. Distribuição de Planos
    const { data: planDistributionData, error: planDistError } = await supabase
      .from('subscriptions')
      .select(`
        plan_id,
        plans!inner(name, price_monthly)
      `)
      .eq('status', 'active');

    let planDistribution: Array<{ name: string; value: number; price: number }> = [];
    if (planDistError) {
      console.error('Erro ao calcular distribuição de planos:', planDistError);
    } else if (planDistributionData) {
      const planCounts = planDistributionData.reduce((acc, sub) => {
        const planName = sub.plans?.name || 'Plano Desconhecido';
        const planPrice = sub.plans?.price_monthly || 0;
        
        if (!acc[planName]) {
          acc[planName] = { count: 0, price: planPrice };
        }
        acc[planName].count++;
        return acc;
      }, {} as Record<string, { count: number; price: number }>);

      planDistribution = Object.entries(planCounts).map(([name, data]) => ({
        name,
        value: data.count,
        price: data.price
      }));
    }

    // 7. Treinos dos Últimos 30 Dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: trainingsTimeSeriesData, error: timeSeriesError } = await supabase
      .from('trainings')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    let trainingsLast30Days: Array<{ date: string; count: number }> = [];
    if (timeSeriesError) {
      console.error('Erro ao calcular série temporal de treinos:', timeSeriesError);
    } else if (trainingsTimeSeriesData) {
      // Agrupar por dia
      const dailyCounts = trainingsTimeSeriesData.reduce((acc, training) => {
        const date = new Date(training.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Criar array com todos os dias dos últimos 30 dias
      const last30Days = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last30Days.push({
          date: dateStr,
          count: dailyCounts[dateStr] || 0
        });
      }

      trainingsLast30Days = last30Days;
    }

    // Compilar resposta final
    const analytics = {
      totalCoaches: totalCoaches || 0,
      newCoachesToday: newCoachesToday || 0,
      totalAthletes: totalAthletes || 0,
      totalTrainingsGenerated: totalTrainingsGenerated || 0,
      monthlyRecurringRevenue,
      planDistribution,
      trainingsLast30Days,
      generatedAt: new Date().toISOString()
    };

    console.log('✅ Métricas coletadas com sucesso:', {
      totalCoaches: analytics.totalCoaches,
      newCoachesToday: analytics.newCoachesToday,
      totalAthletes: analytics.totalAthletes,
      totalTrainings: analytics.totalTrainingsGenerated,
      mrr: analytics.monthlyRecurringRevenue
    });

    return corsResponse(analytics);

  } catch (error: any) {
    console.error('Erro na coleta de analytics:', error);
    return corsResponse({ error: error.message }, 500);
  }
});