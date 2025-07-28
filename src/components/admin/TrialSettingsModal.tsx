import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Users, FileText, Save, Loader2, AlertCircle } from 'lucide-react';
import { AppSettings } from '../../types/database';

interface TrialSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: any) => Promise<boolean>;
  initialSettings: AppSettings | null;
  loading: boolean;
}

const TrialSettingsModal: React.FC<TrialSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSettings,
  loading
}) => {
  const [formData, setFormData] = useState({
    trial_duration_days: 35,
    trial_athlete_limit: 33,
    trial_training_limit: 44
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (initialSettings) {
        setFormData({
          trial_duration_days: initialSettings.trial_duration_days,
          trial_athlete_limit: initialSettings.trial_athlete_limit,
          trial_training_limit: initialSettings.trial_training_limit
        });
      } else {
        // Valores padrão se não houver configurações
        setFormData({
          trial_duration_days: 35,
          trial_athlete_limit: 33,
          trial_training_limit: 44
        });
      }
      setErrors({});
    }
  }, [isOpen, initialSettings]);

  const handleInputChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.trial_duration_days < 1 || formData.trial_duration_days > 365) {
      newErrors.trial_duration_days = 'Duração deve estar entre 1 e 365 dias';
    }

    if (formData.trial_athlete_limit < 1 || formData.trial_athlete_limit > 1000) {
      newErrors.trial_athlete_limit = 'Limite de atletas deve estar entre 1 e 1000';
    }

    if (formData.trial_training_limit < 1 || formData.trial_training_limit > 10000) {
      newErrors.trial_training_limit = 'Limite de treinos deve estar entre 1 e 10000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const success = await onSave(formData);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Configurações do Período de Teste
                </h2>
                <p className="text-orange-100">
                  Configure os limites e duração do trial gratuito
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-orange-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Duração do Teste */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Duração do Teste (dias) *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.trial_duration_days}
                  onChange={(e) => handleInputChange('trial_duration_days', parseInt(e.target.value) || 35)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 transition-colors ${
                    errors.trial_duration_days ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-orange-500'
                  }`}
                  placeholder="35"
                  required
                />
              </div>
              {errors.trial_duration_days && (
                <p className="mt-1 text-sm text-red-600">{errors.trial_duration_days}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Quantos dias os novos usuários terão de acesso gratuito
              </p>
            </div>

            {/* Limite de Atletas */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Limite de Atletas no Teste *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.trial_athlete_limit}
                  onChange={(e) => handleInputChange('trial_athlete_limit', parseInt(e.target.value) || 33)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 transition-colors ${
                    errors.trial_athlete_limit ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-orange-500'
                  }`}
                  placeholder="33"
                  required
                />
              </div>
              {errors.trial_athlete_limit && (
                <p className="mt-1 text-sm text-red-600">{errors.trial_athlete_limit}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Máximo de atletas que podem ser criados durante o teste
              </p>
            </div>

            {/* Limite de Treinos */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Limite de Treinos no Teste *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.trial_training_limit}
                  onChange={(e) => handleInputChange('trial_training_limit', parseInt(e.target.value) || 44)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 transition-colors ${
                    errors.trial_training_limit ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-orange-500'
                  }`}
                  placeholder="44"
                  required
                />
              </div>
              {errors.trial_training_limit && (
                <p className="mt-1 text-sm text-red-600">{errors.trial_training_limit}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Máximo de treinos que podem ser gerados durante o teste
              </p>
            </div>

            {/* Aviso */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-800 font-medium text-sm">Importante:</p>
                  <p className="text-blue-700 text-sm">
                    Estas configurações se aplicam a todos os novos usuários que se cadastrarem na plataforma. 
                    Usuários existentes não serão afetados.
                  </p>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={saving || loading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                <Save className="w-5 h-5" />
                Salvar Configurações
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TrialSettingsModal;