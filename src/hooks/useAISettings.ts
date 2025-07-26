import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

interface AISetting {
  id: string;
  setting_name: string;
  setting_value: string | null;
  updated_by: string | null;
  updated_at: string;
}

export const useAISettings = () => {
  const [settings, setSettings] = useState<AISetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setSettings([]);
      setLoading(false);
      return;
    }

    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('ai_settings')
        .select('*')
        .order('setting_name');

      if (fetchError) {
        // Se a tabela não existir, retorna array vazio
        if (fetchError.code === '42P01') {
          console.warn('Tabela ai_settings não existe. Usando lista vazia.');
          setSettings([]);
          return;
        }
        throw fetchError;
      }

      setSettings(data || []);
    } catch (err: any) {
      console.error('Error fetching AI settings:', err);
      // Não mostrar erro se for tabela ausente
      if (err.code !== '42P01') {
        setError(err.message || 'Erro ao carregar configurações da IA');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingName: string, settingValue: string): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      setError(null);

      const { data, error: upsertError } = await supabase
        .from('ai_settings')
        .upsert({
          setting_name: settingName,
          setting_value: settingValue,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_name'
        })
        .select()
        .single();

      if (upsertError) {
        throw upsertError;
      }

      // Update local state
      setSettings(prev => {
        const existing = prev.find(s => s.setting_name === settingName);
        if (existing) {
          return prev.map(s => s.setting_name === settingName ? data : s);
        } else {
          return [...prev, data];
        }
      });

      return true;
    } catch (err: any) {
      console.error('Error updating AI setting:', err);
      setError(err.message || 'Erro ao atualizar configuração da IA');
      return false;
    }
  };

  const getSetting = (settingName: string): string | null => {
    const setting = settings.find(s => s.setting_name === settingName);
    return setting?.setting_value || null;
  };

  const deleteSetting = async (settingName: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('ai_settings')
        .delete()
        .eq('setting_name', settingName);

      if (deleteError) {
        throw deleteError;
      }

      setSettings(prev => prev.filter(s => s.setting_name !== settingName));
      return true;
    } catch (err: any) {
      console.error('Error deleting AI setting:', err);
      setError(err.message || 'Erro ao excluir configuração da IA');
      return false;
    }
  };

  return {
    settings,
    loading,
    error,
    updateSetting,
    getSetting,
    deleteSetting,
    refetch: fetchSettings,
  };
};