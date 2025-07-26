import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Clock, Users, FileText, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAppSettings } from '../../hooks/useAppSettings';

const TrialSettingsCard: React.FC = () => {
  const { settings, loading, error, updateSettings, refreshSettings } = useAppSettings();
  const [formData, setFormData] = useState({
    trial_duration_days: 30,
    trial_athlete_limit: 5,
    trial_training_limit: 10
  });
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSavedValues, setLastSavedValues] = useState({
    trial_duration_days: 0,
    trial_athlete_limit: 0,
    trial_training_limit: 0
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        trial_duration_days: settings.trial_duration_days,
        trial_athlete_limit: settings.trial_athlete_limit,
        trial_training_limit: settings.trial_training_limit
      });
      setHasChanges(false);
      setLastSavedValues({
        trial_duration_days: settings.trial_duration_days,
        trial_athlete_limit: settings.trial_athlete_limit,
        trial_training_limit: settings.trial_training_limit
      });
    }
  }, [settings]);

  const handleInputChange = (field: string, value: number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      setHasChanges(JSON.stringify(newData) !== JSON.stringify({
        trial_duration_days: settings?.trial_duration_days || 30,
        trial_athlete_limit: settings?.trial_athlete_limit || 5,
        trial_training_limit: settings?.trial_training_limit || 10
      }));
      return newData;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    console.log('💾 SALVAMENTO INICIADO: Valores a serem salvos:', formData);
    try {
      const success = await updateSettings(formData);
      if (success) {
        setHasChanges(false);
        // CRÍTICO: Atualizar valores salvos IMEDIATAMENTE após sucesso
        setLastSavedValues({
          trial_duration_days: formData.trial_duration_days,
          trial_athlete_limit: formData.trial_athlete_limit,
          trial_training_limit: formData.trial_training_limit
        });
        console.log('✅ SALVAMENTO CONCLUÍDO: Novos valores aplicados:', formData);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 AUDITORIA: Usuário solicitou refresh manual das configurações');
      console.log('🔄 AUDITORIA: Forçando busca de dados frescos do banco...');
      await refreshSettings();
      toast.success('Dados atualizados com sucesso!');
      console.log('✅ AUDITORIA: Refresh manual concluído com sucesso');
    } catch (error) {
      console.error('❌ AUDITORIA: Erro ao atualizar dados:', error);
      toast.error('Erro ao atualizar dados');
    } finally {
      setRefreshing(false);
    }
  };
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
          <Clock className="w-6 h-6" />
          <div>
            <h3 className="text-xl font-bold">Configurações do Período de Teste</h3>
            <p className="text-orange-100">
              Configure os limites e duração do período de avaliação gratuita
            </p>
          </div>
          </div>
          
          {/* CORREÇÃO CIRÚRGICA: Botão de refresh manual para dados frescos */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Atualizar dados do servidor"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Atualizar</span>
          </motion.button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Erro ao carregar configurações</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={handleRefresh}
                className="text-red-600 hover:text-red-700 text-sm font-medium mt-1 underline"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Duração do Teste */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Duração do Teste (dias)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="number"
                min="1"
                max="365"
                value={formData.trial_duration_days}
                onChange={(e) => handleInputChange('trial_duration_days', parseInt(e.target.value) || 30)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="30"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Quantos dias os novos usuários terão de acesso gratuito
            </p>
          </div>

          {/* Limite de Atletas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Limite de Atletas no Teste
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="number"
                min="1"
                max="100"
                value={formData.trial_athlete_limit}
                onChange={(e) => handleInputChange('trial_athlete_limit', parseInt(e.target.value) || 5)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="5"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Máximo de atletas que podem ser criados durante o teste
            </p>
          </div>

          {/* Limite de Treinos */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Limite de Treinos no Teste
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="number"
                min="1"
                max="1000"
                value={formData.trial_training_limit}
                onChange={(e) => handleInputChange('trial_training_limit', parseInt(e.target.value) || 10)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="10"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Máximo de treinos que podem ser gerados durante o teste
            </p>
          </div>

          {/* Informações Atuais */}
          {settings && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Configurações Atuais (Dados do Banco):</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Duração:</span>
                  <p className="font-medium text-slate-900">{settings.trial_duration_days} dias</p>
                </div>
                <div>
                  <span className="text-slate-500">Atletas:</span>
                  <p className="font-medium text-slate-900">{settings.trial_athlete_limit} máximo</p>
                </div>
                <div>
                  <span className="text-slate-500">Treinos:</span>
                  <p className="font-medium text-slate-900">{settings.trial_training_limit} máximo</p>
                </div>
              </div>
              {settings.updated_at && (
                <p className="text-xs text-slate-500 mt-2">
                  Última atualização no banco: {new Date(settings.updated_at).toLocaleString('pt-BR')}
                </p>
              )}
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-700">
                  <strong>🔍 Auditoria:</strong> Estes valores são carregados diretamente do banco de dados Supabase.
                  Se não correspondem aos valores do formulário, clique em "Atualizar\" acima.
                </p>
              </div>
            </div>
          )}

          {/* Botão Salvar */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-5 h-5 animate-spin" />}
              <Save className="w-5 h-5" />
              {hasChanges ? 'Salvar Configurações' : 'Configurações Salvas'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TrialSettingsCard;