import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertTriangle, 
  RefreshCw,
  ExternalLink,
  Copy,
  Eye,
  Settings
} from 'lucide-react';

const WebhookDiagnostic: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testWebhookFunction = async () => {
    setTesting(true);
    setError(null);
    setResults(null);

    try {
      console.log('🔍 DIAGNOSTIC: Testando função webhook...');
      
      // Teste 1: Verificar se a função existe
      const webhookUrl = 'https://correria.pro/.netlify/functions/stripe-webhook';
      
      const response = await fetch(webhookUrl, {
        method: 'GET', // Deve retornar erro 405 (método não permitido)
      });

      const responseText = await response.text();
      
      console.log('📊 DIAGNOSTIC: Resposta da função:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });

      // Analisar resultado
      const diagnosticResults = {
        functionExists: response.status !== 404,
        functionWorking: response.status === 405 || (response.status === 200 && responseText.includes('Método não permitido')),
        statusCode: response.status,
        responseBody: responseText,
        timestamp: new Date().toISOString()
      };

      // Teste 2: Verificar variáveis de ambiente (simulado)
      const envVarsCheck = {
        VITE_SUPABASE_URL: !!import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        // Não podemos verificar as variáveis do servidor do frontend
        serverVarsNote: 'Variáveis do servidor devem ser verificadas no Netlify'
      };

      setResults({
        webhook: diagnosticResults,
        envVars: envVarsCheck,
        recommendations: generateRecommendations(diagnosticResults),
        criticalIssues: identifyCriticalIssues(diagnosticResults)
      });

    } catch (err: any) {
      console.error('❌ DIAGNOSTIC: Erro no teste:', err);
      setError(`Erro ao testar webhook: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const identifyCriticalIssues = (results: any) => {
    const issues = [];

    if (!results.functionExists) {
      issues.push({
        severity: 'critical',
        issue: 'Função webhook não existe (404)',
        solution: 'A função não foi deployada. Verifique se o arquivo netlify/functions/stripe-webhook.js existe e foi deployado corretamente.',
        action: 'Redeploy da aplicação necessário'
      });
    } else if (results.statusCode === 502) {
      issues.push({
        severity: 'critical',
        issue: 'Erro 502 - Função falha internamente',
        solution: 'A função existe mas está falhando. Provavelmente erro de variáveis de ambiente ou código.',
        action: 'Verificar logs da função no Netlify e variáveis de ambiente'
      });
    } else if (results.statusCode === 500) {
      issues.push({
        severity: 'critical',
        issue: 'Erro 500 - Erro interno do servidor',
        solution: 'Erro na execução da função. Verificar logs para detalhes específicos.',
        action: 'Analisar logs da função no Netlify'
      });
    } else if (results.functionWorking) {
      issues.push({
        severity: 'warning',
        issue: 'Função responde corretamente, mas webhook pode não estar configurado no Stripe',
        solution: 'Verificar se o webhook está configurado no Stripe com a URL correta e eventos corretos.',
        action: 'Verificar configuração no Dashboard do Stripe'
      });
    }

    return issues;
  };

  const generateRecommendations = (results: any) => {
    const recommendations = [];

    if (!results.functionExists) {
      recommendations.push({
        type: 'error',
        message: 'Função webhook não encontrada (404)',
        action: 'Verificar se a função foi deployada corretamente no Netlify'
      });
    } else if (!results.functionWorking) {
      recommendations.push({
        type: 'error',
        message: `Função retornou status ${results.statusCode}`,
        action: 'Verificar logs da função no Netlify para identificar o erro interno'
      });
    } else {
      recommendations.push({
        type: 'success',
        message: 'Função webhook está acessível e funcionando',
        action: 'Verificar configuração no Stripe e variáveis de ambiente'
      });
    }

    return recommendations;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            🚨 Diagnóstico CRÍTICO do Webhook
          </h3>
          <p className="text-slate-600">
            Identificar por que a ativação automática não funciona
          </p>
        </div>
        
        <button
          onClick={testWebhookFunction}
          disabled={testing}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
        >
          {testing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Diagnosticando...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              🔍 DIAGNOSTICAR AGORA
            </>
          )}
        </button>
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
          {results.criticalIssues && results.criticalIssues.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                🚨 PROBLEMAS CRÍTICOS ENCONTRADOS
              </h4>
              <div className="space-y-4">
                {results.criticalIssues.map((issue: any, index: number) => (
                  <div key={index} className="bg-white border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-red-800">{issue.issue}</p>
                        <p className="text-red-700 text-sm mt-1">{issue.solution}</p>
                        <div className="mt-2 p-2 bg-red-100 rounded border border-red-200">
                          <p className="text-red-800 text-sm font-medium">
                            ⚡ AÇÃO NECESSÁRIA: {issue.action}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Webhook Function Status */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-3">Status da Função Webhook</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Função existe:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.webhook.functionExists)}
                  <span className={results.webhook.functionExists ? 'text-green-600' : 'text-red-600'}>
                    {results.webhook.functionExists ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Função funcionando:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.webhook.functionWorking)}
                  <span className={results.webhook.functionWorking ? 'text-green-600' : 'text-red-600'}>
                    {results.webhook.functionWorking ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Status Code:</span>
                <span className={`font-mono ${
                  results.webhook.statusCode === 405 ? 'text-green-600' : 
                  results.webhook.statusCode === 404 ? 'text-red-600' : 
                  results.webhook.statusCode === 502 ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {results.webhook.statusCode}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-3">🚀 Ações Imediatas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => window.open('https://app.netlify.com', '_blank')}
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir Netlify (Verificar Logs)
              </button>
              
              <button
                onClick={() => window.open('https://dashboard.stripe.com/webhooks', '_blank')}
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Abrir Stripe Webhooks
              </button>
              
              <button
                onClick={() => copyToClipboard('https://correria.pro/.netlify/functions/stripe-webhook')}
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copiar URL do Webhook
              </button>
              
              <button
                onClick={() => window.open('https://correria.pro/.netlify/functions/stripe-webhook', '_blank')}
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Testar URL Diretamente
              </button>
            </div>
          </div>

          {/* Raw Response */}
          {results.webhook.responseBody && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Resposta da Função</h4>
              <pre className="bg-slate-800 text-green-400 p-3 rounded-lg text-sm overflow-x-auto">
                {results.webhook.responseBody}
              </pre>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📋 Próximos Passos:</h4>
            <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
              <li>Execute o diagnóstico acima</li>
              <li>Se função retornar 404 ou 502: Verificar deploy no Netlify</li>
              <li>Se função retornar 405: Verificar configuração no Stripe</li>
              <li>Verificar logs da função no Netlify após pagamento</li>
              <li>Confirmar variáveis de ambiente no Netlify</li>
            </ol>
          </div>
        </motion.div>
      )}

      {/* Initial Instructions */}
      {!results && !testing && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-900 mb-2">🚨 PROBLEMA: Ativação Automática Não Funciona</h4>
          <div className="text-red-800 space-y-2 text-sm">
            <p><strong>SINTOMA:</strong> Usuário paga mas continua restrito</p>
            <p><strong>CAUSA PROVÁVEL:</strong> Webhook do Stripe não está funcionando</p>
            <p><strong>SOLUÇÃO:</strong> Diagnosticar e corrigir o webhook</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookDiagnostic;