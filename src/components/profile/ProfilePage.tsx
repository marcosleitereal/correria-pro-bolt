import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Save, Loader2, Camera, Shield, Lock, Eye, EyeOff, Trash2, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../stores/userStore';
import { useAuthContext } from '../../contexts/AuthContext';
import { useAvatarUpload } from '../../hooks/useAvatarUpload';
import { usePasswordChange } from '../../hooks/usePasswordChange';
import { useSubscriptionStatus } from '../../hooks/useSubscriptionStatus';
import AvatarCropModal from './AvatarCropModal';
import Skeleton from '../ui/Skeleton';

const ProfilePage: React.FC = () => {
  const { profile, loading, error, updateProfile: updateStoreProfile } = useUserStore();
  const { user } = useAuthContext();
  const { uploadAvatar, removeAvatar, uploading: avatarUploading } = useAvatarUpload();
  const { changePassword, hasPassword, loading: passwordLoading } = usePasswordChange();
  const { subscriptionStatus } = useSubscriptionStatus();
  
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || ''
      });
      setAvatarPreview(profile.avatar_url);
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo antes de abrir modal
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Tipo de arquivo não suportado. Use JPG, PNG, GIF ou WebP.');
        return;
      }

      // Validar tamanho (10MB para permitir edição)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('Arquivo muito grande. Máximo 10MB.');
        return;
      }

      setSelectedAvatarFile(file);
      setIsCropModalOpen(true);
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    try {
      const uploadedUrl = await uploadAvatar(croppedFile);
      if (uploadedUrl) {
        // CRÍTICO: Atualizar estado local imediatamente após confirmação do banco
        setAvatarPreview(uploadedUrl);
        
        // CRÍTICO: Atualizar estado global para sincronizar com PrivateLayout
        updateStoreProfile({ avatar_url: uploadedUrl });
        
        setSelectedAvatarFile(null);
        setSuccessMessage('Avatar salvo e sincronizado com sucesso!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      console.error('Erro durante upload do avatar:', error);
    }
  };

  const handleCropCancel = () => {
    setSelectedAvatarFile(null);
    setIsCropModalOpen(false);
  };

  const handleRemoveAvatar = async () => {
    if (window.confirm('Tem certeza que deseja remover seu avatar?')) {
      const success = await removeAvatar();
      if (success) {
        // CRÍTICO: Atualizar estados local e global
        setAvatarPreview(null);
        setSelectedAvatarFile(null);
        updateStoreProfile({ avatar_url: null });
        
        setSuccessMessage('Avatar removido com sucesso!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);

    try {
      const updateData = {
        full_name: formData.full_name.trim() || null
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile?.id);

      if (error) {
        throw error;
      }


      // CRÍTICO: Atualizar estado global imediatamente
      updateStoreProfile(updateData);

      setSuccessMessage('Informações pessoais atualizadas com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await changePassword(passwordData);
    if (success) {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSuccessMessage('Senha alterada com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      coach: 'Treinador',
      admin: 'Administrador'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getAvatarDisplay = () => {
    if (avatarPreview) {
      return (
        <img
          src={avatarPreview}
          alt="Avatar"
          className="w-20 h-20 rounded-full object-cover"
        />
      );
    }
    
    return (
      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
        <User className="w-10 h-10 text-white" />
      </div>
    );
  };


  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-8 w-1/3 mb-6" />
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <Skeleton className="w-20 h-20 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <Skeleton className="h-6 w-1/3 mb-4" />
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Cabeçalho da Página */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto mb-8"
      >
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Meu Perfil
        </h1>
        <p className="text-lg text-slate-600">
          Gerencie suas informações pessoais e configurações da conta
        </p>
      </motion.div>

      {/* Estado de Erro */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl"
        >
          Erro ao carregar perfil: {error}
        </motion.div>
      )}

      {/* Mensagem de Sucesso */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mb-8 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl"
        >
          {successMessage}
        </motion.div>
      )}

      {/* Informações Pessoais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Informações Pessoais</h2>
          
          {/* Avatar e Informações Básicas */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-200">
            <div className="relative">
              {getAvatarDisplay()}
              
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-2 -right-2 bg-white border-2 border-slate-200 rounded-full p-2 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-slate-600" />
              </label>
              
              {avatarPreview && (
                <button
                  onClick={handleRemoveAvatar}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  title="Remover avatar"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {profile?.full_name || user?.email?.split('@')[0] || 'Usuário'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">
                  {profile?.role ? getRoleLabel(profile.role) : 'Carregando...'}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Membro desde {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="seu@email.com"
                  disabled
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                O email não pode ser alterado por questões de segurança
              </p>
            </div>

            {/* Informações da Conta */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Informações da Conta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">ID do Usuário:</span>
                  <p className="font-mono text-slate-800 break-all">{user?.id}</p>
                </div>
                <div>
                  <span className="text-slate-600">Tipo de Conta:</span>
                  <p className="text-slate-800">{profile?.role ? getRoleLabel(profile.role) : 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Botão de Salvar */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                <Save className="w-5 h-5" />
                Salvar Informações
              </button>
            </div>
          </form>
        </div>

        {/* Alterar Senha */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-100 mt-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Lock className="w-6 h-6 text-slate-600" />
            Alterar Senha
          </h2>

          {!hasPassword() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800">
                <strong>Autenticação Social:</strong> Você se autentica com o Google. 
                Para adicionar um acesso via senha, crie uma abaixo.
              </p>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {/* Senha Atual (apenas se o usuário já tem senha) */}
            {hasPassword() && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Senha Atual *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Digite sua senha atual"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Nova Senha */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nova Senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Digite sua nova senha"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Mínimo de 6 caracteres
              </p>
            </div>

            {/* Confirmar Nova Senha */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirmar Nova Senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Confirme sua nova senha"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {/* Informações do Plano */}
            <div className="border-t border-slate-200 pt-4">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Plano Atual
              </h4>
              {subscriptionStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Status:</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      subscriptionStatus.subscription_status === 'trialing' 
                        ? 'bg-blue-100 text-blue-700'
                        : subscriptionStatus.subscription_status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {subscriptionStatus.subscription_status === 'trialing' && '🎯 Período de Teste'}
                      {subscriptionStatus.subscription_status === 'active' && '✅ Plano Ativo'}
                      {subscriptionStatus.subscription_status === 'canceled' && '❌ Cancelado'}
                      {!subscriptionStatus.subscription_status && '⚪ Sem Plano'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Plano:</span>
                    <span className="font-medium text-slate-900">
                      {subscriptionStatus.current_plan_name || 'Período de Teste Gratuito'}
                    </span>
                  </div>
                  
                  {subscriptionStatus.subscription_status === 'trialing' && subscriptionStatus.trial_ends_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Teste expira em:</span>
                      <span className="font-medium text-orange-600">
                        {Math.ceil((new Date(subscriptionStatus.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
                      </span>
                    </div>
                  )}
                  
                  {subscriptionStatus.subscription_status === 'active' && subscriptionStatus.current_period_end && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Próxima cobrança:</span>
                      <span className="font-medium text-slate-900">
                        {new Date(subscriptionStatus.current_period_end).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Acesso:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      subscriptionStatus.current_plan_name === 'Restrito'
                        ? 'bg-red-100 text-red-700'
                        : subscriptionStatus.has_access 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {subscriptionStatus.current_plan_name === 'Restrito' 
                        ? '🚫 BLOQUEADO' 
                        : subscriptionStatus.has_access ? '✅ Liberado' : '❌ Restrito'}
                    </span>
                  </div>
                  
                  {subscriptionStatus.subscription_status === 'trialing' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                      <p className="text-blue-800 text-sm">
                        <strong>🎉 Período de Teste Ativo!</strong><br />
                        Você tem acesso completo a todas as funcionalidades da plataforma durante o período de teste.
                      </p>
                    </div>
                  )}
                  
                  {subscriptionStatus.subscription_status === 'active' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                      <p className="text-green-800 text-sm">
                        <strong>✅ Plano Ativo!</strong><br />
                        Sua assinatura está ativa e você tem acesso completo a todas as funcionalidades da plataforma.
                      </p>
                    </div>
                  )}
                  
                  {(!subscriptionStatus.has_access || subscriptionStatus.current_plan_name === 'Restrito') && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                      <p className="text-red-800 text-sm">
                        <strong>🚫 CONTA BLOQUEADA</strong><br />
                        {subscriptionStatus.current_plan_name === 'Restrito' 
                          ? 'Sua conta está BLOQUEADA no plano restrito. Você pode navegar mas não pode usar as funcionalidades. Faça upgrade para um plano pago.'
                          : 'Seu período de teste expirou. Assine um plano para continuar usando a plataforma.'
                        }
                      </p>
                      <button
                        onClick={() => window.location.href = '/pricing'}
                        className="mt-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-transform duration-300"
                      >
                        🚀 FAZER UPGRADE AGORA
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-slate-500 text-sm">Carregando informações do plano...</p>
                </div>
              )}
            </div>

            {/* Botão de Alterar Senha */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {passwordLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                <Lock className="w-5 h-5" />
                {hasPassword() ? 'Alterar Senha' : 'Criar Senha'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Avatar Crop Modal */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        onClose={handleCropCancel}
        imageFile={selectedAvatarFile}
        onCropComplete={handleCropComplete}
        uploading={avatarUploading}
      />
    </div>
  );
};

export default ProfilePage;