import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

interface CheckoutParams {
  gateway: 'stripe' | 'mercadopago';
  price_id: string;
  success_url: string;
  cancel_url: string;
}

export const useCheckout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuthContext();

  const createCheckoutSession = async (params: CheckoutParams) => {
    if (!session?.access_token) {
      setError('Você precisa estar logado para fazer uma assinatura');
      return;
    }

    console.log('🚀 CHECKOUT DEBUG: Iniciando checkout com parâmetros completos:', {
      gateway: params.gateway,
      price_id: params.price_id,
      success_url: params.success_url,
      cancel_url: params.cancel_url,
      user_session: !!session?.access_token,
      supabase_url: import.meta.env.VITE_SUPABASE_URL
    });
    
    setLoading(true);
    setError(null);

    try {
      // VALIDAÇÃO CRÍTICA: Verificar configurações essenciais
      if (!import.meta.env.VITE_SUPABASE_URL) {
        throw new Error('VITE_SUPABASE_URL não configurado');
      }
      
      if (!params.price_id) {
        throw new Error('Price ID é obrigatório para o checkout');
      }

      console.log('💳 CHECKOUT: Validações OK, Price ID:', params.price_id);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`;
      
      console.log('🌐 CHECKOUT: Chamando Edge Function:', apiUrl);
      console.log('🔑 CHECKOUT: Headers de autenticação:', {
        hasAuth: !!session?.access_token,
        authLength: session?.access_token?.length
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      console.log('📡 CHECKOUT: Status da resposta:', response.status);
      
      const data = await response.json();

      console.log('📊 CHECKOUT: Resposta completa da API:', { 
        status: response.status, 
        ok: response.ok,
        data,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        console.error('❌ CHECKOUT: Erro detalhado na resposta:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details,
          fullResponse: data
        });
        throw new Error(data.error || 'Erro ao criar sessão de checkout');
      }

      if (data.url) {
        console.log('✅ CHECKOUT: Sucesso! Redirecionando para Stripe:', data.url);
        window.location.href = data.url;
      } else {
        console.error('❌ CHECKOUT: URL não recebida na resposta:', data);
        throw new Error('URL de checkout não recebida');
      }
    } catch (err: any) {
      console.error('❌ CHECKOUT: Erro crítico no processo:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return {
    createCheckoutSession,
    loading,
    error,
  };
};