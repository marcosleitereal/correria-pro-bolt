import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { AIProvider } from '../types/database';

export const useAIProviders = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [globalProvider, setGlobalProviderState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setProviders([]);
      setLoading(false);
      return;
    }

    fetchProviders();
    fetchGlobalProvider();
  }, [user]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('ai_providers')
        .select('*')
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      console.log('🔍 [useAIProviders] - Fetched providers:', data);
      console.log('🔍 [useAIProviders] - Provedores carregados:', data);
      setProviders(data || []);
    } catch (err: any) {
      console.error('Error fetching AI providers:', err);
      setError(err.message || 'Erro ao carregar provedores de IA');
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalProvider = async () => {
    try {
      console.log('🔍 [fetchGlobalProvider] - Buscando provedor global...');
      const { data, error: fetchError } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'global_ai_provider')
        .maybeSingle();

      if (fetchError) {
        console.error('❌ [fetchGlobalProvider] - Erro ao buscar:', fetchError);
        throw fetchError;
      }

      console.log('🔍 [fetchGlobalProvider] - Provedor encontrado no banco:', data?.setting_value);
      setGlobalProviderState(data?.setting_value || null);
      console.log('✅ [fetchGlobalProvider] - Estado atualizado para:', data?.setting_value || null);
    } catch (err: any) {
      console.error('Error fetching global provider:', err);
    }
  };

  const updateProvider = async (providerId: string, providerData: Partial<AIProvider>): Promise<boolean> => {
    try {
      setError(null);

      // Note: In a real implementation, the API key should be encrypted server-side
      // For now, we'll store it as-is but in production this should go through an edge function
      const { data, error: updateError } = await supabase
        .from('ai_providers')
        .update({
          ...providerData,
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setProviders(prev => prev.map(provider => 
        provider.id === providerId ? data : provider
      ));
      return true;
    } catch (err: any) {
      console.error('Error updating AI provider:', err);
      setError(err.message || 'Erro ao atualizar provedor de IA');
      return false;
    }
  };

  const setGlobalProvider = async (providerName: string): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      setError(null);
      console.log('💾 [setGlobalProvider] - Salvando novo provedor:', providerName);

      const { error: updateError } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'global_ai_provider',
          setting_value: providerName,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (updateError) {
        console.error('❌ [setGlobalProvider] - Erro ao salvar:', updateError);
        throw updateError;
      }

      console.log('✅ [setGlobalProvider] - Salvo no banco com sucesso');
      setGlobalProviderState(providerName);
      console.log('✅ [setGlobalProvider] - Estado local atualizado para:', providerName);
      
      // Forçar refresh dos providers para garantir sincronização
      await fetchProviders();
      console.log('🔄 [setGlobalProvider] - Providers recarregados');
      
      return true;
    } catch (err: any) {
      console.error('Error setting global provider:', err);
      setError(err.message || 'Erro ao definir provedor global');
      return false;
    }
  };

  const testConnection = async (providerId: string): Promise<boolean> => {
    try {
      setError(null);

      // In a real implementation, this would call an edge function to test the API
      // For now, we'll simulate a test
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock success - in production this would make an actual API call
      return true;
    } catch (err: any) {
      console.error('Error testing connection:', err);
      setError(err.message || 'Erro ao testar conexão');
      return false;
    }
  };

  const getActiveProvider = (): AIProvider | null => {
    if (!globalProvider) return null;
    const foundProvider = providers.find(p => p.name === globalProvider && p.api_key_encrypted);
    console.log('🔍 [getActiveProvider] - Verificando provedor ativo:', {
      globalProvider,
      providersCount: providers.length,
      foundProvider: !!foundProvider,
      providerDetails: foundProvider ? {
        name: foundProvider.name,
        hasApiKey: !!foundProvider.api_key_encrypted,
        model: foundProvider.selected_model,
        isActive: foundProvider.is_active
      } : null
    });
    return foundProvider || null;
  };

  return {
    providers,
    globalProvider,
    activeProvider: getActiveProvider(),
    loading,
    error,
    updateProvider,
    setGlobalProvider,
    testConnection,
    refetch: fetchProviders,
  };
};