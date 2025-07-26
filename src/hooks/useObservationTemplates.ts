import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { ObservationTemplate } from '../types/database';
import { toast } from 'sonner';

export const useObservationTemplates = () => {
  const [templates, setTemplates] = useState<ObservationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    fetchTemplates();
  }, [user]);

  const fetchTemplates = async () => {
    try {
      console.log('useObservationTemplates: Iniciando busca de dados para templates de observação...');
      console.log('useObservationTemplates: ID do usuário:', user?.id);
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('observation_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.log('useObservationTemplates: ERRO CRÍTICO ao buscar templates:', fetchError);
        // Se a tabela não existir, retorna array vazio
        if (fetchError.code === '42P01') {
          console.warn('Tabela observation_templates não existe. Usando lista vazia.');
          setTemplates([]);
          setLoading(false);
          setError(null);
          return;
        }
        throw fetchError;
      }

      console.log('useObservationTemplates: Dados dos templates recebidos com sucesso:', data);
      setTemplates(data || []);
    } catch (err: any) {
      console.error('Error fetching observation templates:', err);
      console.log('useObservationTemplates: ERRO CRÍTICO capturado:', err.message);
      // Não mostrar erro se for tabela ausente
      if (err.code !== '42P01') {
        setError(err.message || 'Erro ao carregar templates de observação');
        toast.error('Erro ao carregar templates');
      }
    } finally {
      setLoading(false);
      console.log('useObservationTemplates: Busca de templates finalizada');
    }
  };

  const createTemplate = async (templateData: Partial<ObservationTemplate>): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      toast.error('Usuário não autenticado');
      return false;
    }

    // Check limit client-side before attempting to create
    if (templates.length >= 5) {
      setError('Limite de 5 templates atingido');
      toast.error('Limite de 5 templates atingido');
      return false;
    }

    try {
      setError(null);

      const { data, error: createError } = await supabase
        .from('observation_templates')
        .insert({
          ...templateData,
          coach_id: user.id
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setTemplates(prev => [data, ...prev]);
      toast.success('Template criado com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Error creating observation template:', err);
      setError(err.message || 'Erro ao criar template de observação');
      toast.error('Erro ao criar template');
      return false;
    }
  };

  const updateTemplate = async (templateId: string, templateData: Partial<ObservationTemplate>): Promise<boolean> => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('observation_templates')
        .update(templateData)
        .eq('id', templateId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setTemplates(prev => prev.map(template => 
        template.id === templateId ? data : template
      ));
      toast.success('Template atualizado com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Error updating observation template:', err);
      setError(err.message || 'Erro ao atualizar template de observação');
      toast.error('Erro ao atualizar template');
      return false;
    }
  };

  const deleteTemplate = async (templateId: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('observation_templates')
        .delete()
        .eq('id', templateId);

      if (deleteError) {
        throw deleteError;
      }

      setTemplates(prev => prev.filter(template => template.id !== templateId));
      toast.success('Template excluído com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Error deleting observation template:', err);
      setError(err.message || 'Erro ao excluir template de observação');
      toast.error('Erro ao excluir template');
      return false;
    }
  };

  const getTemplateById = (templateId: string): ObservationTemplate | undefined => {
    return templates.find(template => template.id === templateId);
  };

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplateById,
    refetch: fetchTemplates,
  };
};