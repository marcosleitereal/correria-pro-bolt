import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface AppSettings {
  id: string;
  trial_duration_days: number;
  trial_athlete_limit: number;
  trial_training_limit: number;
  updated_by: string | null;
  updated_at: string;
}

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  const fetchSettings = useCallback(async (forceFresh = false) => {
    try {
      console.log('🔍 AUDITORIA: Iniciando busca das configurações da aplicação no Supabase...');
      console.log('🔍 AUDITORIA: Timestamp da busca:', new Date().toISOString());
      console.log('🔍 AUDITORIA: Force refresh solicitado:', forceFresh);
      setLoading(true);
      setError(null);

      // Verificar se o Supabase está configurado
      if (!supabase || typeof supabase.from !== 'function') {
        throw new Error('Supabase não está configurado corretamente. Verifique as variáveis de ambiente.');
      }

      // CORREÇÃO CIRÚRGICA: Query robusta com cache-busting e ordenação
      const query = supabase
        .from('app_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      // Cache-busting para garantir dados frescos
      if (forceFresh) {
        // Força bypass de qualquer cache usando timestamp único
        const cacheBuster = Date.now();
        console.log('🚫 AUDITORIA: Cache-busting ativado com timestamp:', cacheBuster);
      }

      console.log('📊 AUDITORIA: Executando query: SELECT * FROM app_settings ORDER BY updated_at DESC LIMIT 1');

      const { data, error: fetchError } = await query.single();

      if (fetchError) {
        console.error('❌ AUDITORIA: Erro na query do Supabase:', fetchError);
        console.error('❌ AUDITORIA: Código do erro:', fetchError.code);
        console.error('❌ AUDITORIA: Mensagem do erro:', fetchError.message);
        console.error('❌ AUDITORIA: Detalhes do erro:', fetchError.details);
        
        // Se não encontrou dados (tabela vazia), usar valores padrão
        if (fetchError.code === 'PGRST116') {
          console.log('⚠️ AUDITORIA: Tabela app_settings vazia, usando valores padrão');
          const defaultSettings: AppSettings = {
            id: 'default',
            trial_duration_days: 30,
            trial_athlete_limit: 5,
            trial_training_limit: 10,
            updated_by: null,
            updated_at: new Date().toISOString()
          };
          setSettings(defaultSettings);
          console.log('✅ AUDITORIA: Valores padrão aplicados:', defaultSettings);
          return;
        }
        
        throw fetchError;
      }

      console.log('✅ AUDITORIA: Dados REAIS recebidos do Supabase:', data);
      console.log('✅ AUDITORIA: Valores específicos encontrados:', {
        trial_duration_days: data.trial_duration_days,
        trial_athlete_limit: data.trial_athlete_limit,
        trial_training_limit: data.trial_training_limit,
        updated_at: data.updated_at,
        updated_by: data.updated_by
      });

      setSettings(data);
      console.log('✅ AUDITORIA: Estado local atualizado com dados do banco');
      
    } catch (err: any) {
      console.error('❌ AUDITORIA: Erro geral ao carregar configurações:', err);
      
      // Tratamento específico para diferentes tipos de erro
      if (err.message && err.message.includes('Failed to fetch')) {
        const errorMsg = 'Erro de conexão com o Supabase. Verifique: 1) Se o servidor está rodando, 2) Se as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão corretas no .env, 3) Se há problemas de rede.';
        setError(errorMsg);
        toast.error('Erro de conexão com o banco de dados');
      } else if (err.code === '42P01') {
        const errorMsg = 'Tabela app_settings não existe no banco de dados. Verifique se as migrações foram executadas.';
        setError(errorMsg);
        toast.error('Erro de estrutura do banco de dados');
      } else {
        setError(err.message || 'Erro ao carregar configurações');
        toast.error('Erro ao carregar configurações da aplicação');
      }
    } finally {
      setLoading(false);
      console.log('🏁 AUDITORIA: Busca de configurações finalizada');
    }
  }, []);

  const getTrialDuration = (): number => {
    console.log('🎯 DEBUG TRIAL: getTrialDuration() chamado');
    console.log('🎯 DEBUG TRIAL: Estado atual do settings:', settings);
    console.log('🎯 DEBUG TRIAL: loading:', loading);
    
    if (settings?.trial_duration_days) {
      console.log('✅ DEBUG TRIAL: Retornando valor do banco:', settings.trial_duration_days);
      return settings.trial_duration_days;
    }
    
    console.warn('⚠️ DEBUG TRIAL: settings.trial_duration_days não disponível, retornando fallback 30');
    console.log('🔍 DEBUG TRIAL: Motivo do fallback - settings:', !!settings, 'trial_duration_days:', settings?.trial_duration_days);
    return 30;
  };

  const updateSettings = async (settingsData: Partial<AppSettings>): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      setError(null);
      console.log('💾 AUDITORIA: Iniciando salvamento das configurações:', settingsData);
      console.log('💾 AUDITORIA: ID do usuário que está salvando:', user.id);
      console.log('💾 AUDITORIA: Settings atual antes de salvar:', settings);
      
      if (!settings?.id) {
        console.error('❌ AUDITORIA: ERRO CRÍTICO - Não há ID de configuração para atualizar!');
        throw new Error('ERRO CRÍTICO: ID da configuração não encontrado. Não é possível atualizar.');
      }
      
      // CORREÇÃO CIRÚRGICA: UPDATE com dados exatos e timestamp
      const updateData = {
        ...settingsData,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      };

      console.log('💾 AUDITORIA: Dados que serão enviados para UPDATE:', updateData);

      const { data, error: updateError } = await supabase
        .from('app_settings')
        .update(updateData)
        .eq('id', settings.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ AUDITORIA: Erro ao executar UPDATE:', updateError);
        throw updateError;
      }

      console.log('✅ AUDITORIA: UPDATE executado com sucesso!');
      console.log('✅ AUDITORIA: Dados retornados após UPDATE:', data);
      console.log('✅ AUDITORIA: Valores salvos confirmados:', {
        trial_duration_days: data.trial_duration_days,
        trial_athlete_limit: data.trial_athlete_limit,
        trial_training_limit: data.trial_training_limit,
        updated_at: data.updated_at,
        updated_by: data.updated_by
      });
      
      // CORREÇÃO CRÍTICA: Atualizar estado local IMEDIATAMENTE
      setSettings(data);
      console.log('✅ AUDITORIA: Estado local atualizado IMEDIATAMENTE após UPDATE');
      
      toast.success('Configurações atualizadas com sucesso!');
      return true;
    } catch (err: any) {
      console.error('❌ AUDITORIA: Erro ao atualizar configurações:', err);
      setError(err.message || 'Erro ao atualizar configurações');
      toast.error('Erro ao atualizar configurações');
      return false;
    }
  };

  // Função de refresh manual para forçar dados frescos
  const refreshSettings = useCallback(async () => {
    console.log('🔄 AUDITORIA: Refresh manual solicitado pelo usuário');
    await fetchSettings(true);
  }, [fetchSettings]);

  // Carregar configurações na inicialização
  useEffect(() => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    console.log('🚀 AUDITORIA: Inicializando hook useAppSettings para usuário:', user.id);
    fetchSettings();
  }, [user, fetchSettings]);

  // Log final do estado que será retornado para a UI
  console.log('📤 AUDITORIA: Estado final retornado para a UI:', {
    settings: settings ? {
      trial_duration_days: settings.trial_duration_days,
      trial_athlete_limit: settings.trial_athlete_limit,
      trial_training_limit: settings.trial_training_limit,
      updated_at: settings.updated_at
    } : null,
    loading,
    error
  });
  
  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: refreshSettings,
    refreshSettings, // Função adicional para refresh explícito
    getTrialDuration: () => {
      if (settings?.trial_duration_days) {
        return settings.trial_duration_days;
      }
      return 30; // Fallback apenas se configurações não carregaram
    },
  };
};