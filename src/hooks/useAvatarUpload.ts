import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const useAvatarUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  const uploadAvatar = async (file: File): Promise<string | null> => {
    console.log('📸 Avatar Upload: Iniciando processo de upload de avatar');
    console.log('📸 Avatar Upload: Detalhes do arquivo selecionado:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (!user) {
      console.error('❌ ERRO CRÍTICO: Usuário não autenticado para upload de avatar');
      setError('Usuário não autenticado');
      toast.error('Usuário não autenticado');
      return null;
    }

    // VALIDAÇÃO CRÍTICA DE SEGURANÇA: Verificar se o ID do usuário é válido
    if (!user.id || typeof user.id !== 'string' || user.id.trim() === '') {
      console.error('❌ ERRO CRÍTICO DE SEGURANÇA: ID do usuário inválido ou ausente');
      setError('ID do usuário inválido');
      toast.error('Erro de segurança: ID do usuário inválido');
      return null;
    }

    console.log('✅ Avatar Upload: Usuário autenticado. ID do usuário:', user.id);

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ ERRO: Tipo de arquivo não suportado:', file.type);
      setError('Tipo de arquivo não suportado. Use JPG, PNG, GIF ou WebP.');
      toast.error('Tipo de arquivo não suportado');
      return null;
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error('❌ ERRO: Arquivo muito grande:', file.size, 'bytes. Máximo permitido:', maxSize, 'bytes');
      setError('Arquivo muito grande. Máximo 5MB.');
      toast.error('Arquivo muito grande. Máximo 5MB.');
      return null;
    }

    console.log('✅ Avatar Upload: Validações de arquivo aprovadas');

    setUploading(true);
    setError(null);
    toast.loading('Enviando avatar para o servidor...', { id: 'avatar-upload' });

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      console.log('1. Avatar Upload: Nome único do arquivo gerado:', fileName);

      // Fazer upload para o Supabase Storage
      console.log('2. Avatar Upload: Iniciando upload para o Supabase Storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ ERRO CRÍTICO no upload para Storage:', uploadError);
        throw uploadError;
      }

      console.log('✅ 3. Upload para o Storage BEM-SUCEDIDO. Dados:', uploadData);

      // Obter URL pública do arquivo
      console.log('4. Avatar Upload: Obtendo URL pública do arquivo...');
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        console.error('❌ ERRO CRÍTICO: Falha ao obter URL pública do arquivo');
        throw new Error('Erro ao obter URL pública do avatar');
      }

      console.log('✅ 5. URL pública obtida com SUCESSO:', urlData.publicUrl);

      // Atualizar perfil do usuário com nova URL do avatar
      console.log('6. Avatar Upload: TENTANDO ATUALIZAR a tabela "profiles" com a nova URL...');
      console.log('6.1. ID do usuário para WHERE clause:', user.id);
      console.log('6.2. Nova URL do avatar para salvar:', urlData.publicUrl);
      
      // VALIDAÇÃO CRÍTICA: Verificar novamente o ID antes da atualização
      if (!user.id) {
        console.error('❌ ERRO CRÍTICO: ID do usuário perdido antes da atualização do banco');
        throw new Error('ID do usuário perdido - operação cancelada por segurança');
      }

      const { data: updateResult, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .single()
        .select();

      // VALIDAÇÃO PÓS-ATUALIZAÇÃO: Verificar se apenas 1 registro foi afetado
      if (updateResult && Array.isArray(updateResult) && updateResult.length !== 1) {
        console.error('❌ ERRO CRÍTICO: Atualização afetou múltiplos registros!', updateResult.length);
        throw new Error(`ERRO DE INTEGRIDADE: ${updateResult.length} registros foram afetados em vez de 1`);
      }

      if (updateError) {
        console.error('❌ ERRO CRÍTICO ao atualizar tabela "profiles":', updateError);
        console.error('❌ Detalhes do erro:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        });
        
        // Se falhar ao atualizar o perfil, tentar remover o arquivo enviado
        console.log('🧹 Limpeza: Removendo arquivo órfão do Storage devido ao erro...');
        await supabase.storage
          .from('avatars')
          .remove([fileName]);
        
        throw updateError;
      }

      console.log('✅ 7. Tabela "profiles" ATUALIZADA COM SUCESSO no banco de dados!');
      console.log('✅ 7.1. Dados retornados da atualização:', updateResult);

      toast.success('Avatar salvo com sucesso!', { id: 'avatar-upload' });
      return urlData.publicUrl;
    } catch (err: any) {
      console.error('❌ ERRO CRÍTICO no processo completo de salvar o avatar:', err);
      setError(err.message || 'Erro ao fazer upload do avatar');
      toast.error('Erro ao fazer upload do avatar', { id: 'avatar-upload' });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async (): Promise<boolean> => {
    console.log('🗑️ Avatar Remove: Iniciando processo de remoção de avatar');
    
    if (!user) {
      console.error('❌ ERRO: Usuário não autenticado para remoção de avatar');
      setError('Usuário não autenticado');
      return false;
    }

    // VALIDAÇÃO CRÍTICA DE SEGURANÇA: Verificar se o ID do usuário é válido
    if (!user.id || typeof user.id !== 'string' || user.id.trim() === '') {
      console.error('❌ ERRO CRÍTICO DE SEGURANÇA: ID do usuário inválido para remoção');
      setError('ID do usuário inválido');
      return false;
    }
    setUploading(true);
    setError(null);
    toast.loading('Removendo avatar...', { id: 'avatar-remove' });

    try {
      // Atualizar perfil para remover URL do avatar
      console.log('🗑️ Avatar Remove: Atualizando tabela "profiles" para remover avatar...');
      
      // VALIDAÇÃO CRÍTICA: Verificar novamente o ID antes da remoção
      if (!user.id) {
        console.error('❌ ERRO CRÍTICO: ID do usuário perdido antes da remoção do banco');
        throw new Error('ID do usuário perdido - operação cancelada por segurança');
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .single();

      if (updateError) {
        console.error('❌ ERRO CRÍTICO ao remover avatar da tabela "profiles":', updateError);
        throw updateError;
      }

      console.log('✅ Avatar Remove: Tabela "profiles" atualizada - avatar removido com sucesso');

      toast.success('Avatar removido com sucesso!', { id: 'avatar-remove' });
      return true;
    } catch (err: any) {
      console.error('❌ ERRO CRÍTICO ao remover avatar:', err);
      setError(err.message || 'Erro ao remover avatar');
      toast.error('Erro ao remover avatar', { id: 'avatar-remove' });
      return false;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadAvatar,
    removeAvatar,
    uploading,
    error,
  };
};