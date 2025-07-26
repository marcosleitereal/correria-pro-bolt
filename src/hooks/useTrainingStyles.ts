import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { TrainingStyle } from '../types/database';

export const useTrainingStyles = () => {
  const [styles, setStyles] = useState<TrainingStyle[]>([]);
  const [favoriteStyles, setFavoriteStyles] = useState<TrainingStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setStyles([]);
      setFavoriteStyles([]);
      setLoading(false);
      return;
    }

    fetchStyles();
    fetchFavoriteStyles();
  }, [user]);

  const fetchStyles = async () => {
    try {
      console.log('useTrainingStyles: Iniciando busca de dados para estilos de treino...');
      console.log('useTrainingStyles: ID do usuário:', user?.id);
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('training_styles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.log('useTrainingStyles: ERRO CRÍTICO ao buscar estilos:', fetchError);
        throw fetchError;
      }

      console.log('useTrainingStyles: Dados dos estilos recebidos com sucesso:', data);
      setStyles(data || []);
    } catch (err: any) {
      console.error('Error fetching training styles:', err);
      console.log('useTrainingStyles: ERRO CRÍTICO capturado:', err.message);
      setError(err.message || 'Erro ao carregar estilos de treino');
    } finally {
      setLoading(false);
      console.log('useTrainingStyles: Busca de estilos finalizada');
    }
  };

  const fetchFavoriteStyles = async () => {
    if (!user) return;

    try {
      console.log('useTrainingStyles: Iniciando busca de estilos favoritos...');
      const { data, error: fetchError } = await supabase
        .from('favorite_styles')
        .select(`
          style_id,
          training_styles (*)
        `)
        .eq('user_id', user.id);

      if (fetchError) {
        console.log('useTrainingStyles: ERRO ao buscar favoritos:', fetchError);
        throw fetchError;
      }

      const favorites = data?.map(item => item.training_styles).filter(Boolean) || [];
      console.log('useTrainingStyles: Estilos favoritos recebidos:', favorites);
      setFavoriteStyles(favorites as TrainingStyle[]);
    } catch (err: any) {
      console.error('Error fetching favorite styles:', err);
      console.log('useTrainingStyles: ERRO ao buscar favoritos capturado:', err.message);
    }
  };

  const createStyle = async (styleData: Partial<TrainingStyle>): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      setError(null);

      const { data, error: createError } = await supabase
        .from('training_styles')
        .insert({
          ...styleData,
          created_by: user.id
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setStyles(prev => [data, ...prev]);
      return true;
    } catch (err: any) {
      console.error('Error creating training style:', err);
      setError(err.message || 'Erro ao criar estilo de treino');
      return false;
    }
  };

  const updateStyle = async (styleId: string, styleData: Partial<TrainingStyle>): Promise<boolean> => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('training_styles')
        .update(styleData)
        .eq('id', styleId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setStyles(prev => prev.map(style => 
        style.id === styleId ? data : style
      ));
      return true;
    } catch (err: any) {
      console.error('Error updating training style:', err);
      setError(err.message || 'Erro ao atualizar estilo de treino');
      return false;
    }
  };

  const toggleFavorite = async (styleId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const isFavorite = favoriteStyles.some(style => style.id === styleId);

      if (isFavorite) {
        const { error: deleteError } = await supabase
          .from('favorite_styles')
          .delete()
          .eq('user_id', user.id)
          .eq('style_id', styleId);

        if (deleteError) throw deleteError;

        setFavoriteStyles(prev => prev.filter(style => style.id !== styleId));
      } else {
        const { error: insertError } = await supabase
          .from('favorite_styles')
          .insert({
            user_id: user.id,
            style_id: styleId
          });

        if (insertError) throw insertError;

        const style = styles.find(s => s.id === styleId);
        if (style) {
          setFavoriteStyles(prev => [...prev, style]);
        }
      }

      return true;
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
      setError(err.message || 'Erro ao atualizar favoritos');
      return false;
    }
  };

  return {
    styles,
    favoriteStyles,
    loading,
    error,
    createStyle,
    updateStyle,
    toggleFavorite,
    refetch: fetchStyles,
  };
};