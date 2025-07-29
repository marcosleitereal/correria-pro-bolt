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

    console.log('🚀 CHECKOUT: Iniciando checkout com parâmetros:', params);
    setLoading(true);
    setError(null);

    try {
      // Verificar se temos price_id
      if (!params.price_id) {
        console.warn('⚠️ CHECKOUT: Price ID não fornecido, usando fallback');
        // Usar um price_id padrão do Stripe para teste
        params.price_id = 'price_1RbPUPBnjFk91bSiqDgyZW9j'; // Do stripe-config.ts
      }

      console.log('💳 CHECKOUT: Price ID final:', params.price_id);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`;
      
      console.log('🌐 CHECKOUT: Chamando API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      console.log('📊 CHECKOUT: Resposta da API:', { status: response.status, data });
      if (!response.ok) {
        console.error('❌ CHECKOUT: Erro na resposta:', data);
        throw new Error(data.error || 'Erro ao criar sessão de checkout');
      }

      if (data.url) {
        console.log('✅ CHECKOUT: Redirecionando para:', data.url);
        window.location.href = data.url;
      } else {
        console.error('❌ CHECKOUT: URL não recebida na resposta');
        throw new Error('URL de checkout não recebida');
      }
    } catch (err: any) {
      console.error('Erro no checkout:', err);
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