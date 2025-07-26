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
      console.log('🔍 FETCH DEBUG: User ID:', user?.id);
      console.log('🔍 FETCH DEBUG: Supabase client:', !!supabase);
      setLoading(true);
      setError(null);

      // Verificar se o Supabase está configurado
      if (!supabase || typeof supabase.from !== 'function') {
        console.error('❌ FETCH DEBUG: Supabase não configurado!');
        throw new Error('Supabase não está configurado corretamente. Verifique as variáveis de ambiente.');
      }

      console.log('🔍 FETCH DEBUG: Executando query na tabela app_settings...');
      
      // Primeiro, vamos verificar se a tabela existe e tem dados
      const { data, error: fetchError, count } = await supabase
        .from('app_settings')
        .select('*')
        .order('updated_at', { ascending: false });

      console.log('🔍 FETCH DEBUG: Query executada. Error:', fetchError, 'Data:', data, 'Count:', count);
      
      if (fetchError) {
        console.error('❌ FETCH DEBUG: Erro na query:', fetchError);
        
        // Se a tabela não existe ou está vazia
        if (fetchError.code === 'PGRST116' || fetchError.code === '42P01') {
          console.log('⚠️ FETCH DEBUG: Tabela vazia ou não existe, criando configuração padrão...');
          
          // Tentar criar uma configuração padrão
          const { data: insertData, error: insertError } = await supabase
            .from('app_settings')
            .insert({
              trial_duration_days: 35, // Usar 35 como padrão baseado no que você configurou
              trial_athlete_limit: 33,
              trial_training_limit: 44,
              updated_by: user?.id || null
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('❌ FETCH DEBUG: Erro ao criar configuração padrão:', insertError);
            // Usar configuração em memória como último recurso
            const defaultSettings: AppSettings = {
              id: 'default',
              trial_duration_days: 35,
              trial_athlete_limit: 33,
              trial_training_limit: 44,
              updated_by: null,
              updated_at: new Date().toISOString()
            };
            setSettings(defaultSettings);
            console.log('✅ FETCH DEBUG: Usando configuração padrão em memória:', defaultSettings);
            return;
          } else {
            console.log('✅ FETCH DEBUG: Configuração padrão criada no banco:', insertData);
            setSettings(insertData);
            return;
          }
        }
        
        throw fetchError;
      }

      // Se não há dados, criar configuração padrão
      if (!data || data.length === 0) {
        console.log('⚠️ FETCH DEBUG: Nenhum dado encontrado, criando configuração padrão...');
        
        const { data: insertData, error: insertError } = await supabase
          .from('app_settings')
          .insert({
            trial_duration_days: 35,
            trial_athlete_limit: 33,
            trial_training_limit: 44,
            updated_by: user?.id || null
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('❌ FETCH DEBUG: Erro ao criar configuração:', insertError);
          const defaultSettings: AppSettings = {
            id: 'default',
            trial_duration_days: 35,
            trial_athlete_limit: 33,
            trial_training_limit: 44,
            updated_by: null,
            updated_at: new Date().toISOString()
          };
          setSettings(defaultSettings);
          console.log('✅ FETCH DEBUG: Usando configuração padrão:', defaultSettings);
          return;
        } else {
          console.log('✅ FETCH DEBUG: Configuração criada:', insertData);
          setSettings(insertData);
          return;
        }
      }

      // Usar o primeiro registro (mais recente)
      const latestSettings = data[0];
      console.log('✅ FETCH DEBUG: Dados encontrados:', latestSettings);
      console.log('✅ FETCH DEBUG: trial_duration_days específico:', latestSettings.trial_duration_days);
      
      setSettings(latestSettings);
      console.log('✅ FETCH DEBUG: Settings atualizados no estado');
      
    } catch (err: any) {
      console.error('❌ FETCH DEBUG: Erro geral:', err);
      
      // Em caso de erro, usar configuração padrão baseada no que você configurou
      const defaultSettings: AppSettings = {
        id: 'default',
        trial_duration_days: 35, // Baseado na sua configuração atual
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
      console.log('✅ GET_TRIAL DEBUG: Retornando valor do banco:', settings.trial_duration_days);
      return settings.trial_duration_days;
    }
    
    console.warn('⚠️ GET_TRIAL DEBUG: Usando fallback 35 (baseado na sua configuração)');
    return 35; // Mudei de 30 para 35 baseado na sua configuração atual
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
      console.log('💾 UPDATE DEBUG: Settings atual:', settings);
      
      if (!settings?.id) {
        console.error('❌ UPDATE DEBUG: Sem ID para atualizar, tentando criar novo registro...');
        
        // Se não há settings, criar um novo registro
        const { data: insertData, error: insertError } = await supabase
          .from('app_settings')
          .insert({
            ...settingsData,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('❌ UPDATE DEBUG: Erro ao criar:', insertError);
          throw insertError;
        }
        
        console.log('✅ UPDATE DEBUG: Novo registro criado:', insertData);
        setSettings(insertData);
        toast.success('Configurações criadas com sucesso!');
        return true;
      }
      
      // Atualizar registro existente
      const updateData = {
        ...settingsData,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      };

      console.log('💾 UPDATE DEBUG: Dados para UPDATE:', updateData);

      const { data, error: updateError } = await supabase
        .from('app_settings')
        .update(updateData)
        .eq('id', settings.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ UPDATE DEBUG: Erro no UPDATE:', updateError);
        throw updateError;
      }

      console.log('✅ UPDATE DEBUG: UPDATE bem-sucedido:', data);
      setSettings(data);
      console.log('✅ UPDATE DEBUG: Estado local atualizado');
      
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

  // Carregar configurações na inicialização
  useEffect(() => {
    console.log('🚀 EFFECT DEBUG: useEffect disparado. User:', !!user, 'Settings:', !!settings, 'Loading:', loading);
    
    if (!user) {
      console.log('🚀 EFFECT DEBUG: Sem usuário, limpando settings');
      setSettings(null);
      setLoading(false);
      return;
    }

    // Sempre buscar configurações quando há usuário e settings é null
    if (!settings && !loading) {
      console.log('🚀 EFFECT DEBUG: Usuário presente, settings null, iniciando fetch...');
      fetchSettings();
    }
  }, [user, fetchSettings]);

  // Log final do estado
  console.log('📤 FINAL DEBUG: Estado retornado:', {
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