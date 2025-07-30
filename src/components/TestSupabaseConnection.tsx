import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

const TestSupabaseConnection: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setStatus('loading');
    setMessage('Testando conexão com Supabase...');

    try {
      console.log('🔍 Iniciando teste de conectividade com Supabase...');
      
      // Teste 1: Verificar se o cliente foi inicializado
      if (!supabase) {
        throw new Error('Cliente Supabase não foi inicializado');
      }
      console.log('✅ Cliente Supabase inicializado');

      // Teste 1.5: Verificar variáveis de ambiente
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configuradas');
      }
      
      console.log('✅ Variáveis de ambiente configuradas');
      console.log('🔗 URL:', supabaseUrl);
      console.log('🔑 Key:', supabaseKey.substring(0, 20) + '...');

      // Teste 2: Verificar sessão atual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.log('⚠️ Erro ao obter sessão (normal se não logado):', sessionError.message);
      } else {
        console.log('✅ Verificação de sessão bem-sucedida');
      }

      // Teste 3: Tentar uma query simples (sem autenticação)
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (testError) {
        console.log('❌ Erro na query de teste:', testError);
        
        if (testError.message.includes('Failed to fetch') || testError.message.includes('NetworkError')) {
          throw new Error('Erro de conectividade: Não foi possível conectar ao Supabase. Verifique sua internet.');
        } else {
          throw new Error(`Erro na comunicação: ${testError.message}`);
        }
      }

      console.log('✅ Query de teste bem-sucedida');
      
      setStatus('success');
      setMessage('Conexão com Supabase estabelecida com sucesso!');
      setDetails({
        session: sessionData.session ? 'Usuário logado' : 'Nenhum usuário logado',
        queryTest: 'Query de teste executada com sucesso',
        supabaseUrl: supabaseUrl,
        hasValidKey: !!supabaseKey,
        timestamp: new Date().toLocaleString('pt-BR')
      });

    } catch (error: any) {
      console.error('❌ Erro no teste de conectividade:', error);
      setStatus('error');
      
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Erro de conectividade: Não foi possível conectar ao servidor Supabase. Verifique sua conexão com a internet.';
      } else if (error.message.includes('Variáveis de ambiente')) {
        errorMessage = 'Erro de configuração: Variáveis de ambiente do Supabase não estão configuradas corretamente.';
      }
      
      setMessage(errorMessage);
      setDetails({
        error: error.message,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'Não configurada',
        hasValidKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        timestamp: new Date().toLocaleString('pt-BR')
      });
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-6 h-6 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'loading':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
    }
  };

  const getTextColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-800';
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getBackgroundColor()}`}>
      <div className="flex items-center gap-3 mb-3">
        {getIcon()}
        <h3 className={`font-semibold ${getTextColor()}`}>
          Teste de Conectividade Supabase
        </h3>
      </div>
      
      <p className={`mb-3 ${getTextColor()}`}>
        {message}
      </p>

      {details && (
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <h4 className="font-medium text-slate-900 mb-2">Detalhes:</h4>
          <pre className="text-xs text-slate-700 whitespace-pre-wrap">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-3">
        <button
          onClick={testConnection}
          disabled={status === 'loading'}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          Testar Novamente
        </button>
      </div>
    </div>
  );
};

export default TestSupabaseConnection;