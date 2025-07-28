import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Brain, FileText, Check, AlertCircle } from 'lucide-react';
import { useAISettings } from '../../hooks/useAISettings';
import AISettingsModal from './AISettingsModal';

const AICustomization: React.FC = () => {
  const { 
    settings, 
    loading, 
    error, 
    updateSetting,
    getSetting 
  } = useAISettings();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const systemPersona = getSetting('system_persona') || '';
  const promptTemplate = getSetting('training_prompt_template') || '';

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSave = async (type: 'persona' | 'template', value: string): Promise<boolean> => {
    try {
      const settingKey = type === 'persona' ? 'system_persona' : 'training_prompt_template';
      const success = await updateSetting(settingKey, value);
      
      if (success) {
        const message = type === 'persona' 
          ? 'Personalidade da IA salva com sucesso!' 
          : 'Template do prompt salvo com sucesso!';
        showSuccess(message);
      }
      
      return success;
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="bg-slate-50 rounded-lg p-6">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 w-full overflow-x-hidden">
      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
        >
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Erro ao carregar configurações</p>
            <p className="text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <Brain className="w-6 h-6 text-purple-600" />
              Customização da IA
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Personalize o comportamento e os prompts da Inteligência Artificial
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
          >
            <Edit className="w-5 h-5" />
            Editar Configurações
          </motion.button>
        </div>
      </div>

      {/* Current Settings Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Persona Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5" />
              <div>
                <h3 className="font-bold">Personalidade da IA</h3>
                <p className="text-blue-100 text-sm">System Prompt atual</p>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {systemPersona ? (
              <div className="bg-slate-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                <p className="text-slate-700 text-sm whitespace-pre-wrap">
                  {systemPersona}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhuma personalidade configurada</p>
                <p className="text-slate-400 text-sm">A IA usará comportamento padrão</p>
              </div>
            )}
            
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {systemPersona.length} caracteres
              </span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                Editar →
              </button>
            </div>
          </div>
        </motion.div>

        {/* Prompt Template Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              <div>
                <h3 className="font-bold">Template do Prompt</h3>
                <p className="text-purple-100 text-sm">Estrutura de geração</p>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {promptTemplate ? (
              <div className="bg-slate-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                <p className="text-slate-700 text-sm whitespace-pre-wrap">
                  {promptTemplate}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhum template configurado</p>
                <p className="text-slate-400 text-sm">A IA usará template padrão</p>
              </div>
            )}
            
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {promptTemplate.length} caracteres
              </span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors"
              >
                Editar →
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Usage Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 w-full"
      >
        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-xs sm:text-sm md:text-base">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          Como Funciona
        </h4>
        <div className="space-y-2 text-xs sm:text-sm text-slate-700 w-full">
          <p>
            <strong>1. Personalidade:</strong> Define como a IA se comporta e responde (tom, expertise, abordagem).
          </p>
          <p>
            <strong>2. Template:</strong> Estrutura como os dados são organizados e enviados para a IA.
          </p>
          <p>
            <strong>3. Geração:</strong> Durante a criação de treinos, essas configurações são aplicadas automaticamente.
          </p>
        </div>
      </motion.div>

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialPersona={systemPersona}
        initialTemplate={promptTemplate}
        loading={loading}
      />
    </div>
  );
};

export default AICustomization;