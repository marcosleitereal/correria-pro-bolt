import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Loader2, Database, User, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const EmergencyDiagnostic: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activating, setActivating] = useState(false);

  const runEmergencyDiagnostic = async () => {
    setTesting(true);
    try {
      console.log('🚨 EMERGENCY: Iniciando diagnóstico de emergência...');
      
      const diagnosis = {
        timestamp: new Date().toISOString(),
        plans_check: null,
        user_check: null,
        webhook_check: null,
        critical_issues: []
      };

      // 1. VERIFICAR PLANOS CRÍTICOS
      console.log('📊 EMERGENCY: Verificando planos...');
      const { data: allPlans, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (plansError) {
        diagnosis.critical_issues.push({
          severity: 'CRITICAL',
          issue: 'Erro ao buscar planos',
          details: plansError.message
        });
      } else {
        const activePlans = allPlans?.filter(p => p.is_active) || [];
        const publicPlans = activePlans.filter(p => p.name !== 'Restrito');
        const restrictedPlan = allPlans?.find(p => p.name === 'Restrito');

        diagnosis.plans_check = {
          total_plans: allPlans?.length || 0,
          active_plans: activePlans.length,
          public_plans: publicPlans.length,
          has_restricted_plan: !!restrictedPlan,
          first_public_plan: publicPlans[0] || null,
          all_plans: allPlans
        };

        if (publicPlans.length === 0) {
          diagnosis.critical_issues.push({
            severity: 'CRITICAL',
            issue: 'NENHUM PLANO PÚBLICO ATIVO',
            details: 'Não há planos ativos para ativar usuários que pagam'
          });
        }

        if (!restrictedPlan) {
          diagnosis.critical_issues.push({
            severity: 'WARNING',
            issue: 'Plano "Restrito" não existe',
            details: 'Necessário para usuários com trial expirado'
          });
        }
      }

      // 2. VERIFICAR USUÁRIO ESPECÍFICO
      console.log('👤 EMERGENCY: Verificando usuário de teste...');
      const testEmails = ['2dia@teste.com', '3dia@teste.com', 'teste@exemplo.com'];
      
      for (const email of testEmails) {
        const { data: userData, error: userError } = await supabase
          .from('user_subscription_details')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (userData) {
          const { data: stripeCustomer } = await supabase
            .from('stripe_customers')
            .select('customer_id')
            .eq('user_id', userData.user_id)
            .maybeSingle();

          diagnosis.user_check = {
            email,
            user_id: userData.user_id,
            current_status: userData.subscription_status,
            current_plan: userData.current_plan_name,
            has_access: userData.has_access,
            has_stripe_customer: !!stripeCustomer,
            stripe_customer_id: stripeCustomer?.customer_id || null
          };

          if (stripeCustomer && userData.subscription_status !== 'active') {
            diagnosis.critical_issues.push({
              severity: 'CRITICAL',
              issue: 'USUÁRIO PAGOU MAS NÃO FOI ATIVADO',
              details: `${email} tem customer Stripe mas status é ${userData.subscription_status}`
            });
          }
          break;
        }
      }

      setResults(diagnosis);

    } catch (error: any) {
      console.error('❌ EMERGENCY: Erro no diagnóstico:', error);
      setResults({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const emergencyActivateUser = async (userEmail: string) => {
    setActivating(true);
    try {
      console.log('🚀 EMERGENCY: Ativação de emergência para:', userEmail);

      // Buscar usuário
      const { data: userData } = await supabase
        .from('user_subscription_details')
        .select('user_id')
        .eq('email', userEmail)
        .single();

      if (!userData) {
        throw new Error('Usuário não encontrado');
      }

      // Buscar primeiro plano ativo
      const { data: activePlan } = await supabase
        .from('plans')
        .select('id, name')
        .eq('is_active', true)
        .neq('name', 'Restrito')
        .order('price_monthly', { ascending: true })
        .limit(1)
        .single();

      if (!activePlan) {
        throw new Error('Nenhum plano ativo encontrado');
      }

      // ATIVAÇÃO FORÇADA
      const now = new Date();
      const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      // DELETE + INSERT para garantir estado limpo
      await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', userData.user_id);

      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userData.user_id,
          plan_id: activePlan.id,
          status: 'active',
          trial_ends_at: null,
          current_period_start: now.toISOString(),
          current_period_end: oneYearLater.toISOString()
        });

      if (insertError) {
        throw insertError;
      }

      alert(`✅ USUÁRIO ${userEmail} ATIVADO COM SUCESSO!\n\nFaça logout/login para ver as mudanças.`);
      
      // Reexecutar diagnóstico
      await runEmergencyDiagnostic();

    } catch (error: any) {
      console.error('❌ EMERGENCY: Erro na ativação:', error);
      alert(`❌ ERRO: ${error.message}`);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-8 h-8 text-red-600" />
        <div>
          <h2 className="text-2xl font-bold text-red-900">🚨 DIAGNÓSTICO DE EMERGÊNCIA</h2>
          <p className="text-red-700">Sistema de pagamento não está ativando usuários</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={runEmergencyDiagnostic}
          disabled={testing}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {testing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Diagnosticando...
            </>
          ) : (
            <>
              <Database className="w-5 h-5" />
              🔍 EXECUTAR DIAGNÓSTICO COMPLETO
            </>
          )}
        </button>

        {results?.user_check && (
          <button
            onClick={() => emergencyActivateUser(results.user_check.email)}
            disabled={activating}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {activating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Ativando...
              </>
            ) : (
              <>
                <User className="w-5 h-5" />
                🚀 ATIVAR USUÁRIO AGORA
              </>
            )}
          </button>
        )}
      </div>

      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Critical Issues */}
          {results.critical_issues && results.critical_issues.length > 0 && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                🚨 PROBLEMAS CRÍTICOS ENCONTRADOS
              </h3>
              {results.critical_issues.map((issue: any, index: number) => (
                <div key={index} className="bg-white border border-red-200 rounded p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-red-800">{issue.issue}</p>
                      <p className="text-red-700 text-sm">{issue.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Plans Analysis */}
          {results.plans_check && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Database className="w-5 h-5" />
                📊 ANÁLISE DOS PLANOS
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{results.plans_check.total_plans}</div>
                  <div className="text-sm text-slate-600">Total</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${results.plans_check.active_plans > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {results.plans_check.active_plans}
                  </div>
                  <div className="text-sm text-slate-600">Ativos</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${results.plans_check.public_plans > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {results.plans_check.public_plans}
                  </div>
                  <div className="text-sm text-slate-600">Públicos</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${results.plans_check.has_restricted_plan ? 'text-green-600' : 'text-red-600'}`}>
                    {results.plans_check.has_restricted_plan ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-slate-600">Restrito</div>
                </div>
              </div>

              {results.plans_check.first_public_plan && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-green-800 font-medium">
                    ✅ Plano para ativação: {results.plans_check.first_public_plan.name} 
                    (R$ {results.plans_check.first_public_plan.price_monthly})
                  </p>
                </div>
              )}
            </div>
          )}

          {/* User Analysis */}
          {results.user_check && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                👤 ANÁLISE DO USUÁRIO: {results.user_check.email}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Status Atual:</span>
                  <span className={`font-bold ${
                    results.user_check.current_status === 'active' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {results.user_check.current_status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Plano Atual:</span>
                  <span className="font-bold">{results.user_check.current_plan || 'Nenhum'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tem Acesso:</span>
                  <span className={`font-bold ${results.user_check.has_access ? 'text-green-600' : 'text-red-600'}`}>
                    {results.user_check.has_access ? '✅ SIM' : '❌ NÃO'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Customer Stripe:</span>
                  <span className={`font-bold ${results.user_check.has_stripe_customer ? 'text-green-600' : 'text-red-600'}`}>
                    {results.user_check.has_stripe_customer ? '✅ SIM' : '❌ NÃO'}
                  </span>
                </div>
              </div>

              {results.user_check.has_stripe_customer && !results.user_check.has_access && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-red-800 font-bold">
                    🚨 PROBLEMA CRÍTICO: Usuário tem customer Stripe mas não tem acesso!
                  </p>
                  <p className="text-red-700 text-sm">
                    Isso significa que o webhook não está ativando corretamente.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Raw Data */}
          <details className="bg-slate-50 rounded-lg p-4">
            <summary className="font-bold cursor-pointer">📊 Dados Completos</summary>
            <pre className="mt-3 bg-slate-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </motion.div>
      )}

      {!results && !testing && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">
            🔍 Execute o diagnóstico para identificar o problema exato no sistema de ativação.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmergencyDiagnostic;