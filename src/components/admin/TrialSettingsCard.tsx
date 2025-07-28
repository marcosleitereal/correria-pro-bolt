import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Clock, Users, FileText, Loader2, AlertCircle, RefreshCw, Edit, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useAppSettings } from '../../hooks/useAppSettings';
import TrialSettingsModal from './TrialSettingsModal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            onClick={() => setIsModalOpen(true)}
            disabled={refreshing || loading}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Editar configurações"
          >
            <Edit className="w-5 h-5" />
            <span className="text-sm font-medium">Editar</span>
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

        {/* Informações Atuais */}
        {settings ? (
          <div className="bg-slate-50 rounded-lg p-6">
            <h4 className="text-lg font-medium text-slate-700 mb-4">Configurações Atuais:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-3xl font-bold text-orange-600 mb-2">{settings.trial_duration_days}</div>
                <div className="text-sm text-slate-600">Dias de Teste</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-3xl font-bold text-blue-600 mb-2">{settings.trial_athlete_limit}</div>
                <div className="text-sm text-slate-600">Atletas Máximo</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-3xl font-bold text-purple-600 mb-2">{settings.trial_training_limit}</div>
                <div className="text-sm text-slate-600">Treinos Máximo</div>
              </div>
            </div>
            {settings.updated_at && (
              <p className="text-xs text-slate-500 mt-4 text-center">
                Última atualização: {new Date(settings.updated_at).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-slate-900 mb-2">Configurações Não Encontradas</h4>
            <p className="text-slate-600 mb-4">
              As configurações do período de teste não foram encontradas no banco de dados.
            </p>
            <button
              onClick={handleOpenModal}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 flex items-center gap-2 mx-auto"
            >
              <Edit className="w-5 h-5" />
              Configurar Agora
            </button>
          </div>
        )}
      </div>

      {/* Modal de Configurações */}
      <TrialSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={updateSettings}
        initialSettings={settings}
        loading={saving}
      />
    </motion.div>
  );
};

export default TrialSettingsCard;