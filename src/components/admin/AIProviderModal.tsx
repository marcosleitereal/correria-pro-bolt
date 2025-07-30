import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Brain, Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { AIProvider } from '../../types/database';

interface AIProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (providerData: Partial<AIProvider>) => Promise<void>;
  provider?: AIProvider | null;
  loading: boolean;
}

const AIProviderModal: React.FC<AIProviderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  provider,
  loading
}) => {
  const [formData, setFormData] = useState({
    api_key: '',
    selected_model: ''
  });

  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Model options for each provider
  const modelOptions: Record<string, string[]> = {
    'OpenAI': ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    'Groq': ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    'Google AI': ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
    'Anthropic': ['claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus']
  };

  // Reset form when modal opens/closes or provider changes
  useEffect(() => {
    if (isOpen && provider) {
      setFormData({
        api_key: '', // Never pre-fill API key for security
        selected_model: provider.selected_model || ''
      });
      setErrors({});
      setShowApiKey(false);
    }
  }, [isOpen, provider]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.api_key.trim()) {
      newErrors.api_key = 'Chave de API é obrigatória';
    }

    if (!formData.selected_model) {
      newErrors.selected_model = 'Modelo é obrigatório';
    }

    // Basic API key format validation
    if (formData.api_key.trim()) {
      const apiKey = formData.api_key.trim();
      
      if (provider?.name === 'OpenAI' && !apiKey.startsWith('sk-')) {
        newErrors.api_key = 'Chave da OpenAI deve começar com "sk-"';
      } else if (provider?.name === 'Anthropic' && !apiKey.startsWith('sk-ant-')) {
        newErrors.api_key = 'Chave da Anthropic deve começar com "sk-ant-"';
      } else if (apiKey.length < 20) {
        newErrors.api_key = 'Chave de API muito curta';
      }
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
      const providerData: Partial<AIProvider> = {
        api_key_encrypted: formData.api_key.trim(), // Will be encrypted server-side
        selected_model: formData.selected_model
      };

      await onSave(providerData);
    } catch (error) {
      console.error('Error saving provider:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !provider) return null;

  const availableModels = modelOptions[provider.name] || [];

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
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Configurar {provider.name}
                </h2>
                <p className="text-blue-100">
                  Configure a chave de API e modelo para este provedor
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

          {/* Security Warning */}
          <div className="bg-yellow-50 border-b border-yellow-200 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-yellow-800 font-medium text-sm">Segurança</p>
                <p className="text-yellow-700 text-xs">
                  As chaves de API são criptografadas antes de serem armazenadas no banco de dados.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Chave de API *
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type={showApiKey ? 'text' : 'password'}
                  name="api_key"
                  value={formData.api_key}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors font-mono text-sm ${
                    errors.api_key ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                  }`}
                  placeholder={`Digite a chave de API do ${provider.name}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.api_key && (
                <p className="mt-1 text-sm text-red-600">{errors.api_key}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                {provider.name === 'OpenAI' && 'Exemplo: sk-proj-...'}
                {provider.name === 'Anthropic' && 'Exemplo: sk-ant-...'}
                {provider.name === 'Groq' && 'Obtenha sua chave em console.groq.com'}
                {provider.name === 'Gemini' && 'Obtenha sua chave no Google AI Studio'}
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Modelo *
              </label>
              <div className="relative">
                <Brain className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <select
                  name="selected_model"
                  value={formData.selected_model}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.selected_model ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                  }`}
                  required
                >
                  <option value="">Selecione um modelo</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
              {errors.selected_model && (
                <p className="mt-1 text-sm text-red-600">{errors.selected_model}</p>
              )}
            </div>

            {/* Current Configuration */}
            {provider.api_key_encrypted && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Configuração Atual:</h4>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>Modelo: {provider.selected_model || 'Não configurado'}</p>
                  <p>Última atualização: {new Date(provider.updated_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            )}
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
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                Salvar Configuração
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AIProviderModal;