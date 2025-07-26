import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Brain, FileText, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAISettings } from '../../hooks/useAISettings';

const AICustomization: React.FC = () => {
  const { 
    settings, 
    loading, 
    error, 
    updateSetting,
    getSetting 
  } = useAISettings();

  const [systemPersona, setSystemPersona] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [savingPersona, setSavingPersona] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings.length > 0) {
      setSystemPersona(getSetting('system_persona') || '');
      setPromptTemplate(getSetting('training_prompt_template') || '');
    }
  }, [settings, getSetting]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSavePersona = async () => {
    setSavingPersona(true);
    try {
      const success = await updateSetting('system_persona', systemPersona);
      if (success) {
        showSuccess('Personalidade da IA salva com sucesso!');
      }
    } catch (error) {
      console.error('Error saving persona:', error);
    } finally {
      setSavingPersona(false);
    }
  };

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      const success = await updateSetting('training_prompt_template', promptTemplate);
      if (success) {
        showSuccess('Template do prompt salvo com sucesso!');
      }
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setSavingTemplate(false);
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

      {/* AI Personality Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden w-full"
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6" />
            <div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold">Personalidade da IA (System Prompt)</h3>
              <p className="text-blue-100 text-sm sm:text-base">
                Defina o comportamento e a persona da IA que será usada em todas as gerações de treino
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 w-full">
          <div className="mb-4">
            <p className="text-slate-600 text-xs sm:text-sm mb-2">
              <strong>Exemplo:</strong> "Você é um treinador de corrida de elite, especialista em fisiologia do esporte..."
            </p>
            <p className="text-slate-500 text-xs">
              Esta personalidade será aplicada a todas as interações com a IA para manter consistência no tom e abordagem.
            </p>
          </div>

          <textarea
            value={systemPersona}
            onChange={(e) => setSystemPersona(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none font-mono text-xs sm:text-sm break-all"
            placeholder="Digite a personalidade e comportamento desejado para a IA..."
          />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <span className="text-xs text-slate-500">
              {systemPersona.length} caracteres
            </span>
            <button
              onClick={handleSavePersona}
              disabled={savingPersona || !systemPersona.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
            >
              {savingPersona && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              Salvar Personalidade
            </button>
          </div>
        </div>
      </motion.div>

      {/* Prompt Template Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden w-full"
      >
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold">Template do Prompt de Geração de Treino</h3>
              <p className="text-purple-100 text-sm sm:text-base">
                Configure como os dados são enviados para a IA durante a geração de treinos
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 w-full">
          <div className="mb-4">
            <h4 className="font-semibold text-slate-900 mb-3 text-xs sm:text-sm md:text-base">Variáveis Disponíveis:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4">
              <div className="bg-slate-50 rounded-lg p-2 sm:p-3 w-full">
                <code className="text-blue-600 font-mono text-sm">[runner_data]</code>
                <p className="text-xs text-slate-600 mt-1">Dados completos do corredor (nome, idade, nível, etc.)</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 sm:p-3 w-full">
                <code className="text-purple-600 font-mono text-sm">[style_data]</code>
                <p className="text-xs text-slate-600 mt-1">Informações do estilo de treino selecionado</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 sm:p-3 w-full">
                <code className="text-green-600 font-mono text-sm">[period_data]</code>
                <p className="text-xs text-slate-600 mt-1">Duração e período do plano de treino</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 sm:p-3 w-full">
                <code className="text-orange-600 font-mono text-sm">[athlete_first_name]</code>
                <p className="text-xs text-slate-600 mt-1">Primeiro nome do atleta para personalização</p>
              </div>
            </div>
            <p className="text-slate-500 text-xs">
              Use essas variáveis no template para inserir dinamicamente os dados do atleta e treino.
            </p>
          </div>

          <textarea
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none font-mono text-xs sm:text-sm break-all"
            placeholder="Digite o template do prompt que será usado para gerar treinos..."
          />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <span className="text-xs text-slate-500">
              {promptTemplate.length} caracteres
            </span>
            <button
              onClick={handleSaveTemplate}
              disabled={savingTemplate || !promptTemplate.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
            >
              {savingTemplate && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              Salvar Template
            </button>
          </div>
        </div>
      </motion.div>

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
    </div>
  );
};

export default AICustomization;