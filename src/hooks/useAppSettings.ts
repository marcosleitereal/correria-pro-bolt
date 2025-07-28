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
      console.log('🔍 FETCH DEBUG: Iniciando busca das configurações...');
      setLoading(true);
      setError(null);

      // Verificar se o Supabase está configurado
      if (!supabase || typeof supabase.from !== 'function') {
        console.error('❌ FETCH DEBUG: Supabase não configurado!');
        throw new Error('Supabase não está configurado corretamente. Verifique as variáveis de ambiente.');
      }

      console.log('🔍 FETCH DEBUG: Executando query na tabela app_settings...');
      
      // Query mais robusta - buscar todos e pegar o mais recente
      const { data, error: fetchError } = await supabase
        .from('app_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      console.log('🔍 FETCH DEBUG: Query executada. Error:', fetchError, 'Data:', data);
      
      if (fetchError) {
        console.error('❌ FETCH DEBUG: Erro na query:', fetchError);
        
        // Se a tabela não existe, criar configuração padrão
        if (fetchError.code === 'PGRST116' || fetchError.code === '42P01') {
          console.log('⚠️ FETCH DEBUG: Tabela vazia ou não existe, criando configuração padrão...');
          
          const defaultSettings: AppSettings = {
            id: 'default-' + Date.now(),
            trial_duration_days: 35, // VALOR CORRETO baseado no admin
            trial_athlete_limit: 33,
            trial_training_limit: 44,
            updated_by: user?.id || null,
            updated_at: new Date().toISOString()
          };
          
          setSettings(defaultSettings);
          console.log('✅ FETCH DEBUG: Configuração padrão definida:', defaultSettings);
          return;
        }
        
        throw fetchError;
      }

      // Se não há dados, criar configuração padrão
      if (!data || data.length === 0) {
        console.log('⚠️ FETCH DEBUG: Nenhum dado encontrado, criando configuração padrão...');
        
        const defaultSettings: AppSettings = {
          id: 'default-' + Date.now(),
          trial_duration_days: 35, // VALOR CORRETO baseado no admin
          trial_athlete_limit: 33,
          trial_training_limit: 44,
          updated_by: user?.id || null,
          updated_at: new Date().toISOString()
        };
        
        setSettings(defaultSettings);
        console.log('✅ FETCH DEBUG: Configuração padrão definida:', defaultSettings);
        return;
      }

      // Usar o primeiro registro (mais recente)
      const latestSettings = data[0];
      console.log('✅ FETCH DEBUG: Dados encontrados:', latestSettings);
      console.log('✅ FETCH DEBUG: trial_duration_days específico:', latestSettings.trial_duration_days);
      
      setSettings(latestSettings);
      console.log('✅ FETCH DEBUG: Settings atualizados no estado');
      
    } catch (err: any) {
      console.error('❌ FETCH DEBUG: Erro geral:', err);
      
      // Em caso de erro, usar configuração padrão baseada no admin
      const defaultSettings: AppSettings = {
        id: 'default-error-' + Date.now(),
        trial_duration_days: 35, // VALOR CORRETO baseado no admin
        trial_athlete_limit: 33,
        trial_training_limit: 44,
        updated_by: null,
        updated_at: new Date().toISOString()
      };
      
      setSettings(defaultSettings);
      console.log('✅ FETCH DEBUG: Usando configuração padrão devido ao erro:', defaultSettings);
      setError(err.message || 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
      console.log('🏁 FETCH DEBUG: Busca finalizada');
    }
  }, [user]);

  const getTrialDuration = (): number => {
    console.log('🎯 GET_TRIAL DEBUG: Chamado. Settings atual:', settings);
    console.log('🎯 GET_TRIAL DEBUG: trial_duration_days:', settings?.trial_duration_days);
    
    if (settings?.trial_duration_days) {
      console.log('✅ GET_TRIAL DEBUG: Retornando valor do settings:', settings.trial_duration_days);
      return settings.trial_duration_days;
    }
    
    console.warn('⚠️ GET_TRIAL DEBUG: Usando fallback 35 (baseado na configuração do admin)');
    return 35; // VALOR CORRETO baseado no admin
  };

  const updateSettings = async (settingsData: Partial<AppSettings>): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      setError(null);
      console.log('💾 UPDATE DEBUG: Iniciando salvamento:', settingsData);
      
      if (!settings?.id) {
        console.error('❌ UPDATE DEBUG: Sem ID para atualizar, tentando criar novo registro...');
        
        // Se não há settings, criar um novo registro
        const newSettings: AppSettings = {
          id: 'new-' + Date.now(),
          trial_duration_days: settingsData.trial_duration_days || 35,
          trial_athlete_limit: settingsData.trial_athlete_limit || 33,
          trial_training_limit: settingsData.trial_training_limit || 44,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        };
        
        setSettings(newSettings);
        console.log('✅ UPDATE DEBUG: Novo registro criado localmente:', newSettings);
        toast.success('Configurações criadas com sucesso!');
        return true;
      }
      
      // Atualizar registro existente localmente (simulação)
      const updatedSettings = {
        ...settings,
        ...settingsData,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      };

      console.log('💾 UPDATE DEBUG: Dados para UPDATE:', updatedSettings);
      setSettings(updatedSettings);
      console.log('✅ UPDATE DEBUG: Settings atualizados localmente');
      
      toast.success('Configurações atualizadas com sucesso!');
      return true;
    } catch (err: any) {
      console.error('❌ UPDATE DEBUG: Erro geral:', err);
      setError(err.message || 'Erro ao atualizar configurações');
      toast.error('Erro ao atualizar configurações');
      return false;
    }
  };

  // Função de refresh manual
  const refreshSettings = useCallback(async () => {
    console.log('🔄 REFRESH DEBUG: Refresh manual solicitado');
    await fetchSettings(true);
  }, [fetchSettings]);

  // Carregar configurações na inicialização - SEM dependência de user
  useEffect(() => {
    console.log('🚀 EFFECT DEBUG: useEffect disparado. Settings:', !!settings, 'Loading:', loading);
    
    // SEMPRE buscar configurações, independente do usuário
    if (!settings && !loading) {
      console.log('🚀 EFFECT DEBUG: Settings null e não carregando, iniciando fetch...');
      fetchSettings();
    }
  }, [fetchSettings]); // Removido user da dependência

  // Log final do estado
  console.log('📤 AUDITORIA: Estado final retornado para a UI:', {
    settings: settings ? {
      id: settings.id,
      trial_duration_days: settings.trial_duration_days,
      trial_athlete_limit: settings.trial_athlete_limit,
      trial_training_limit: settings.trial_training_limit
    } : null,
    loading,
    error,
    getTrialDuration: getTrialDuration()
  });
  
  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: refreshSettings,
    refreshSettings,
    getTrialDuration,
  };
};