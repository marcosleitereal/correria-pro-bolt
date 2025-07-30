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
  Eye
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
        recommendations: generateRecommendations(diagnosticResults)
      });

    } catch (err: any) {
      console.error('❌ DIAGNOSTIC: Erro no teste:', err);
      setError(`Erro ao testar webhook: ${err.message}`);
    } finally {
      setTesting(false);
    }
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
            Diagnóstico do Webhook Stripe
          </h3>
          <p className="text-slate-600">
            Verificar se o webhook está funcionando corretamente
          </p>
        </div>
        
        <button
          onClick={testWebhookFunction}
          disabled={testing}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
        >
          {testing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Executar Diagnóstico
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
                  results.webhook.statusCode === 404 ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {results.webhook.statusCode}
                </span>
              </div>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-3">Variáveis de Ambiente (Frontend)</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>VITE_SUPABASE_URL:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.envVars.VITE_SUPABASE_URL)}
                  <span className={results.envVars.VITE_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                    {results.envVars.VITE_SUPABASE_URL ? 'Configurada' : 'Ausente'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>VITE_SUPABASE_ANON_KEY:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.envVars.VITE_SUPABASE_ANON_KEY)}
                  <span className={results.envVars.VITE_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                    {results.envVars.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'Ausente'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Importante:</strong> As variáveis do servidor (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY) 
                devem ser verificadas no painel do Netlify.
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-3">Recomendações</h4>
            <div className="space-y-3">
              {results.recommendations.map((rec: any, index: number) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  rec.type === 'success' ? 'bg-green-50 border-green-200' :
                  rec.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start gap-2">
                    {rec.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : rec.type === 'error' ? (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${
                        rec.type === 'success' ? 'text-green-800' :
                        rec.type === 'error' ? 'text-red-800' : 'text-yellow-800'
                      }`}>
                        {rec.message}
                      </p>
                      <p className={`text-sm mt-1 ${
                        rec.type === 'success' ? 'text-green-700' :
                        rec.type === 'error' ? 'text-red-700' : 'text-yellow-700'
                      }`}>
                        {rec.action}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-3">Ações Rápidas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => window.open('https://app.netlify.com', '_blank')}
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir Netlify Dashboard
              </button>
              
              <button
                onClick={() => window.open('https://dashboard.stripe.com/webhooks', '_blank')}
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
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
        </motion.div>
      )}

      {/* Initial Instructions */}
      {!results && !testing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Como usar este diagnóstico:</h4>
          <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
            <li>Clique em "Executar Diagnóstico" para testar a função webhook</li>
            <li>Analise os resultados e siga as recomendações</li>
            <li>Use as "Ações Rápidas" para acessar os painéis necessários</li>
            <li>Após correções, execute o diagnóstico novamente</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default WebhookDiagnostic;