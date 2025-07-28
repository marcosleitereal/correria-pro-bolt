import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Brain, FileText, Loader2 } from 'lucide-react';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: 'persona' | 'template', value: string) => Promise<boolean>;
  initialPersona: string;
  initialTemplate: string;
  loading: boolean;
}

const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPersona,
  initialTemplate,
  loading
}) => {
  const [activeTab, setActiveTab] = useState<'persona' | 'template'>('persona');
  const [personaValue, setPersonaValue] = useState('');
  const [templateValue, setTemplateValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPersonaValue(initialPersona);
      setTemplateValue(initialTemplate);
    }
  }, [isOpen, initialPersona, initialTemplate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const value = activeTab === 'persona' ? personaValue : templateValue;
      const success = await onSave(activeTab, value);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  const getCurrentValue = () => {
    return activeTab === 'persona' ? personaValue : templateValue;
  };

  const handleValueChange = (value: string) => {
    if (activeTab === 'persona') {
      setPersonaValue(value);
    } else {
      setTemplateValue(value);
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Configurações de IA
                </h2>
                <p className="text-blue-100">
                  Personalize o comportamento da Inteligência Artificial
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('persona')}
                className={`flex-1 py-4 px-6 font-medium transition-colors ${
                  activeTab === 'persona'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Brain className="w-5 h-5" />
                  Personalidade da IA
                </div>
              </button>
              <button
                onClick={() => setActiveTab('template')}
                className={`flex-1 py-4 px-6 font-medium transition-colors ${
                  activeTab === 'template'
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5" />
                  Template do Prompt
                </div>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'persona' ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Personalidade da IA (System Prompt)
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    Defina como a IA deve se comportar e responder. Esta personalidade será aplicada 
                    a todas as gerações de treino para manter consistência.
                  </p>
                  <p className="text-slate-500 text-xs mb-4">
                    <strong>Exemplo:</strong> "Você é um treinador de corrida de elite, especialista em fisiologia do esporte..."
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Personalidade da IA
                  </label>
                  <textarea
                    value={personaValue}
                    onChange={(e) => setPersonaValue(e.target.value)}
                    rows={12}
                    className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="Digite a personalidade e comportamento desejado para a IA..."
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    {personaValue.length} caracteres
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Template do Prompt de Geração
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    Configure como os dados são organizados e enviados para a IA durante a geração de treinos.
                  </p>
                </div>

                {/* Variables Guide */}
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-slate-900 mb-3">Variáveis Disponíveis:</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded p-3 border">
                      <code className="text-blue-600 font-mono text-sm">[runner_data]</code>
                      <p className="text-xs text-slate-600 mt-1">Dados do corredor</p>
                    </div>
                    <div className="bg-white rounded p-3 border">
                      <code className="text-purple-600 font-mono text-sm">[style_data]</code>
                      <p className="text-xs text-slate-600 mt-1">Estilo de treino</p>
                    </div>
                    <div className="bg-white rounded p-3 border">
                      <code className="text-green-600 font-mono text-sm">[period_data]</code>
                      <p className="text-xs text-slate-600 mt-1">Duração do plano</p>
                    </div>
                    <div className="bg-white rounded p-3 border">
                      <code className="text-orange-600 font-mono text-sm">[athlete_first_name]</code>
                      <p className="text-xs text-slate-600 mt-1">Nome do atleta</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Template do Prompt
                  </label>
                  <textarea
                    value={templateValue}
                    onChange={(e) => setTemplateValue(e.target.value)}
                    rows={12}
                    className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                    placeholder="Digite o template do prompt que será usado para gerar treinos..."
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    {templateValue.length} caracteres
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving || loading || !getCurrentValue().trim()}
                className={`flex-1 text-white px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 ${
                  activeTab === 'persona' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                    : 'bg-gradient-to-r from-purple-500 to-purple-600'
                }`}
              >
                {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                <Save className="w-5 h-5" />
                Salvar {activeTab === 'persona' ? 'Personalidade' : 'Template'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AISettingsModal;