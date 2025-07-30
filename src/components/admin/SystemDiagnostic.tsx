import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Database, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  User,
  CreditCard,
  Settings,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const SystemDiagnostic: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('2dia@teste.com');

  const runCompleteAnalysis = async () => {
    setTesting(true);
    setError(null);
    setResults(null);

    try {
      console.log('🔍 DIAGNOSTIC: Iniciando análise completa do sistema...');
      
      const analysis = {
        timestamp: new Date().toISOString(),
        user_analysis: null,
        plans_analysis: null,
        stripe_analysis: null,
        subscription_analysis: null,
        recommendations: []
      };

      // 1. ANÁLISE DOS PLANOS
      console.log('📊 DIAGNOSTIC: Verificando planos ativos...');
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (plansError) {
        throw new Error(`Erro ao buscar planos: ${plansError.message}`);
      }

      const activePlans = plansData?.filter(p => p.is_active) || [];
      const restrictedPlan = plansData?.find(p => p.name === 'Restrito');
      const publicPlans = activePlans.filter(p => p.name !== 'Restrito');

      analysis.plans_analysis = {
        total_plans: plansData?.length || 0,
        active_plans: activePlans.length,
        public_plans: publicPlans.length,
        has_restricted_plan: !!restrictedPlan,
        plans_with_stripe_id: activePlans.filter(p => p.stripe_price_id_monthly).length,
        first_active_plan: publicPlans[0] || null
      };

      // 2. ANÁLISE DO USUÁRIO ESPECÍFICO
      if (userEmail) {
        console.log('👤 DIAGNOSTIC: Analisando usuário:', userEmail);
        
        // Buscar dados completos do usuário
        const { data: userData, error: userError } = await supabase
          .from('user_subscription_details')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();

        if (userError && userError.code !== 'PGRST116') {
          console.error('Erro ao buscar usuário:', userError);
        }

        // Buscar customer Stripe
        const { data: stripeData, error: stripeError } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', userData?.user_id)
          .maybeSingle();

        if (stripeError && stripeError.code !== 'PGRST116') {
          console.error('Erro ao buscar customer Stripe:', stripeError);
        }

        analysis.user_analysis = {
          user_found: !!userData,
          user_data: userData,
          has_stripe_customer: !!stripeData,
          stripe_customer_id: stripeData?.customer_id || null,
          current_status: userData?.subscription_status || 'not_found',
          has_access: userData?.has_access || false,
          current_plan: userData?.current_plan_name || 'none'
        };
      }

      // 3. ANÁLISE DA TABELA SUBSCRIPTIONS
      if (userEmail && analysis.user_analysis?.user_data?.user_id) {
        console.log('📋 DIAGNOSTIC: Verificando subscription...');
        
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', analysis.user_analysis.user_data.user_id)
          .maybeSingle();

        analysis.subscription_analysis = {
          subscription_exists: !!subData,
          subscription_data: subData,
          error: subError?.message || null
        };
      }

      // 4. GERAR RECOMENDAÇÕES
      const recommendations = [];

      if (analysis.plans_analysis.active_plans === 0) {
        recommendations.push({
          severity: 'critical',
          issue: 'Nenhum plano ativo encontrado',
          solution: 'Ativar pelo menos um plano na tabela plans',
          action: 'UPDATE plans SET is_active = true WHERE name != \'Restrito\''
        });
      }

      if (!analysis.plans_analysis.has_restricted_plan) {
        recommendations.push({
          severity: 'warning',
          issue: 'Plano "Restrito" não encontrado',
          solution: 'Criar plano "Restrito" para usuários com trial expirado',
          action: 'Criar plano com nome exato "Restrito"'
        });
      }

      if (analysis.user_analysis && !analysis.user_analysis.has_stripe_customer) {
        recommendations.push({
          severity: 'critical',
          issue: 'Usuário não tem customer no Stripe',
          solution: 'Usuário precisa ter registro na tabela stripe_customers',
          action: 'Verificar se o pagamento criou o customer corretamente'
        });
      }

      if (analysis.user_analysis && analysis.user_analysis.current_status === 'trialing') {
        recommendations.push({
          severity: 'warning',
          issue: 'Usuário ainda em trial após pagamento',
          solution: 'Webhook não atualizou o status para active',
          action: 'Verificar logs do webhook e ativar manualmente'
        });
      }

      analysis.recommendations = recommendations;
      setResults(analysis);

    } catch (err: any) {
      console.error('❌ DIAGNOSTIC: Erro na análise:', err);
      setError(`Erro na análise: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const activateUserManually = async () => {
    if (!userEmail || !results?.user_analysis?.user_data?.user_id) {
      alert('Execute a análise primeiro para obter os dados do usuário');
      return;
    }

    try {
      const userId = results.user_analysis.user_data.user_id;
      const firstActivePlan = results.plans_analysis.first_active_plan;

      if (!firstActivePlan) {
        alert('Nenhum plano ativo encontrado para ativação');
        return;
      }

      console.log('🚀 DIAGNOSTIC: Ativando usuário manualmente...');

      // Deletar subscription anterior
      await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', userId);

      // Criar nova subscription ativa
      const now = new Date();
      const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: firstActivePlan.id,
          status: 'active',
          trial_ends_at: null,
          current_period_start: now.toISOString(),
          current_period_end: oneYearLater.toISOString()
        });

      if (insertError) {
        throw insertError;
      }

      alert('✅ Usuário ativado com sucesso! Faça logout/login para ver as mudanças.');
      
      // Reexecutar análise
      await runCompleteAnalysis();

    } catch (err: any) {
      console.error('❌ Erro na ativação manual:', err);
      alert(`Erro na ativação: ${err.message}`);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            🔍 Diagnóstico Completo do Sistema
          </h3>
          <p className="text-slate-600">
            Análise detalhada de planos, usuários e lógica de ativação
          </p>
        </div>
        
        <button
          onClick={runCompleteAnalysis}
          disabled={testing}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
        >
          {testing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Executar Análise Completa
            </>
          )}
        </button>
      </div>

      {/* User Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Email do Usuário para Análise:
        </label>
        <input
          type="email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="email@exemplo.com"
        />
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Critical Issues */}
          {results.recommendations && results.recommendations.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                🚨 PROBLEMAS ENCONTRADOS
              </h4>
              {results.recommendations.map((rec: any, index: number) => (
                <div key={index} className={`border rounded-lg p-4 ${getSeverityColor(rec.severity)}`}>
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{rec.issue}</p>
                      <p className="text-sm mt-1">{rec.solution}</p>
                      <div className="mt-2 p-2 bg-white bg-opacity-50 rounded border">
                        <p className="text-sm font-medium">
                          ⚡ AÇÃO: {rec.action}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Plans Analysis */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Análise dos Planos
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{results.plans_analysis.total_plans}</div>
                <div className="text-slate-600">Total de Planos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.plans_analysis.active_plans}</div>
                <div className="text-slate-600">Planos Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{results.plans_analysis.public_plans}</div>
                <div className="text-slate-600">Planos Públicos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{results.plans_analysis.plans_with_stripe_id}</div>
                <div className="text-slate-600">Com Stripe ID</div>
              </div>
            </div>
            
            {results.plans_analysis.first_active_plan && (
              <div className="mt-4 p-3 bg-white rounded border">
                <p className="text-sm font-medium text-slate-900">
                  Primeiro Plano Ativo: {results.plans_analysis.first_active_plan.name} 
                  (R$ {results.plans_analysis.first_active_plan.price_monthly})
                </p>
              </div>
            )}
          </div>

          {/* User Analysis */}
          {results.user_analysis && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Análise do Usuário: {userEmail}
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Usuário encontrado:</span>
                  <div className="flex items-center gap-2">
                    {results.user_analysis.user_found ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span>{results.user_analysis.user_found ? 'Sim' : 'Não'}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Customer no Stripe:</span>
                  <div className="flex items-center gap-2">
                    {results.user_analysis.has_stripe_customer ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span>{results.user_analysis.has_stripe_customer ? 'Sim' : 'Não'}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Status Atual:</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    results.user_analysis.current_status === 'active' ? 'bg-green-100 text-green-700' :
                    results.user_analysis.current_status === 'trialing' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {results.user_analysis.current_status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Tem Acesso:</span>
                  <div className="flex items-center gap-2">
                    {results.user_analysis.has_access ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span>{results.user_analysis.has_access ? 'Sim' : 'Não'}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Plano Atual:</span>
                  <span className="font-medium">{results.user_analysis.current_plan}</span>
                </div>
              </div>

              {/* Manual Activation Button */}
              {results.user_analysis.user_found && !results.user_analysis.has_access && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <button
                    onClick={activateUserManually}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    🚀 ATIVAR USUÁRIO MANUALMENTE
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Raw Data */}
          <details className="bg-slate-50 rounded-lg p-4">
            <summary className="font-semibold text-slate-900 cursor-pointer">
              📊 Dados Brutos da Análise
            </summary>
            <pre className="mt-3 bg-slate-800 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </motion.div>
      )}

      {/* Initial Instructions */}
      {!results && !testing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">🔍 O que esta análise faz:</h4>
          <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
            <li>Verifica se existem planos ativos no sistema</li>
            <li>Analisa o estado atual do usuário específico</li>
            <li>Verifica se o usuário tem customer no Stripe</li>
            <li>Identifica problemas na lógica de ativação</li>
            <li>Oferece ativação manual como fallback</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SystemDiagnostic;