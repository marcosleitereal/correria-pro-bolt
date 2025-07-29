import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { PaymentGateway } from '../types/database';

export const usePaymentGateways = () => {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setGateways([]);
      setLoading(false);
      return;
    }

    fetchGateways();
  }, [user]);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('payment_gateways')
        .select('*')
        .order('gateway_name');

      if (fetchError) {
        throw fetchError;
      }

      setGateways(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar gateways de pagamento:', err);
      setError(err.message || 'Erro ao carregar gateways de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const updateGateway = async (gatewayName: string, gatewayData: Partial<PaymentGateway>): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      setError(null);
      
      console.log('🔧 Atualizando gateway:', gatewayName, 'com dados:', gatewayData);

      const updateData = {
        ...gatewayData,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      };

      // CORREÇÃO CRÍTICA: Usar UPSERT em vez de UPDATE para criar se não existir
      const { data, error: updateError } = await supabase
        .from('payment_gateways')
        .upsert({
          gateway_name: gatewayName,
          ...updateData
        }, {
          onConflict: 'gateway_name'
        })
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erro ao atualizar gateway:', updateError);
        throw updateError;
      }

      console.log('✅ Gateway atualizado com sucesso:', data);
      
      setGateways(prev => prev.map(gateway => 
        gateway.gateway_name === gatewayName ? data : gateway
      ));
      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar gateway:', err);
      setError(err.message || 'Erro ao atualizar gateway');
      return false;
    }
  };

  const activateGateway = async (gatewayName: string): Promise<boolean> => {
    try {
      setError(null);

      // First, deactivate all other gateways
      await supabase
        .from('payment_gateways')
        .update({ is_active: false })
        .neq('gateway_name', gatewayName);

      // Then activate the selected gateway
      const { data, error: updateError } = await supabase
        .from('payment_gateways')
        .update({ 
          is_active: true,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('gateway_name', gatewayName)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Refresh all gateways to reflect changes
      await fetchGateways();
      return true;
    } catch (err: any) {
      console.error('Erro ao ativar gateway:', err);
      setError(err.message || 'Erro ao ativar gateway');
      return false;
    }
  };

  const getActiveGateway = (): PaymentGateway | null => {
    return gateways.find(gateway => gateway.is_active) || null;
  };

  const getGatewayByName = (name: string): PaymentGateway | undefined => {
    return gateways.find(gateway => gateway.gateway_name === name);
  };

  const isGatewayConfigured = (gatewayName: string): boolean => {
    const gateway = getGatewayByName(gatewayName);
    return !!(gateway?.public_key && gateway?.secret_key_encrypted);
  };

  return {
    gateways,
    loading,
    error,
    updateGateway,
    activateGateway,
    getActiveGateway,
    getGatewayByName,
    isGatewayConfigured,
    refetch: fetchGateways,
  };
};