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
      const { data, error: fetchError } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'global_ai_provider')
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setGlobalProviderState(data?.setting_value || null);
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
        throw updateError;
      }

      setGlobalProviderState(providerName);
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
    return providers.find(p => p.name === globalProvider && p.api_key_encrypted) || null;
  };

  return {
    providers,
    globalProvider,
    loading,
    error,
    updateProvider,
    setGlobalProvider,
    testConnection,
    getActiveProvider,
    refetch: fetchProviders,
  };
};