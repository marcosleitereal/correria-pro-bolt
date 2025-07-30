import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Eye, EyeOff, Check, X, Loader2, Brain, Key, AlertCircle } from 'lucide-react';
import { useAIProviders } from '../../hooks/useAIProviders';
import AIProviderModal from './AIProviderModal';
import { AIProvider } from '../../types/database';

const AIProviderManagement: React.FC = () => {
  const { 
    providers, 
    globalProvider, 
    loading, 
    error, 
    updateProvider, 
    setGlobalProvider,
    testConnection 
  } = useAIProviders();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  const handleEditProvider = (provider: AIProvider) => {
    setEditingProvider(provider);
    setIsModalOpen(true);
  };

  const handleUpdateProvider = async (providerData: Partial<AIProvider>) => {
    if (!editingProvider) return;
    
    const success = await updateProvider(editingProvider.id, providerData);
    if (success) {
      setIsModalOpen(false);
      setEditingProvider(null);
    }
  };

  const handleSetGlobalProvider = async (providerId: string) => {
    console.log('🔄 [AIProviderManagement] - Mudando provedor global para:', providerId);
    await setGlobalProvider(providerId);
    console.log('✅ [AIProviderManagement] - Troca de provedor concluída');
  };

  const handleTestConnection = async (providerId: string) => {
    setTestingProvider(providerId);
    const success = await testConnection(providerId);
    setTestingProvider(null);
    
    if (success) {
      // Show success feedback
      console.log('Conexão testada com sucesso');
    }
  };

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const maskApiKey = (apiKey: string | null) => {
    if (!apiKey) return 'Não configurada';
    if (apiKey.length <= 8) return '••••••••';
    return `${apiKey.substring(0, 4)}••••${apiKey.substring(apiKey.length - 4)}`;
  };

  const getProviderIcon = (name: string) => {
    const icons: Record<string, string> = {
      'OpenAI': '🤖',
      'Groq': '⚡',
      'Gemini': '💎',
      'Anthropic': '🧠'
    };
    return icons[name] || '🔧';
  };

  const getStatusBadge = (provider: AIProvider) => {
    const isGlobal = globalProvider === provider.name;
    const hasApiKey = !!provider.api_key_encrypted;
    
    if (isGlobal && hasApiKey) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
          <Check className="w-4 h-4 mr-1" />
          Ativo Global
        </span>
      );
    }
    
    if (hasApiKey) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
          Configurado
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
        <X className="w-4 h-4 mr-1" />
        Não Configurado
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-4">
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      {/* Header */}
      <div className="w-full">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <Brain className="w-6 h-6 text-blue-600" />
            Gestão de Provedores de IA
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Configure as chaves de API e modelos para geração automática de treinos
          </p>
        </div>
      </div>

      {/* Global Provider Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 w-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 mb-2">
              Provedor Ativo Global
            </h3>
            <p className="text-sm sm:text-base text-slate-600">
              Selecione qual provedor de IA será usado por padrão para gerar treinos
            </p>
          </div>
          <div className="w-full sm:min-w-48 sm:w-auto">
            <select
              value={globalProvider || ''}
              onChange={(e) => handleSetGlobalProvider(e.target.value)}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
            >
              <option value="">Selecionar provedor</option>
              {providers
                .filter(p => p.api_key_encrypted)
                .map((provider) => (
                  <option key={provider.id} value={provider.name}>
                    {getProviderIcon(provider.name)} {provider.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Erro ao carregar provedores</p>
            <p className="text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Providers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden w-full"
      >
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-slate-900">Provedor</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-900">Chave de API</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-900">Modelo Selecionado</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-900">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {providers.map((provider, index) => (
                <motion.tr
                  key={provider.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getProviderIcon(provider.name)}</span>
                      <div>
                        <p className="font-semibold text-slate-900">{provider.name}</p>
                        {globalProvider === provider.name && (
                          <p className="text-xs text-blue-600 font-medium">Provedor Global</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-slate-700">
                        {showApiKeys[provider.id] && provider.api_key_encrypted
                          ? provider.api_key_encrypted
                          : maskApiKey(provider.api_key_encrypted)
                        }
                      </span>
                      {provider.api_key_encrypted && (
                        <button
                          onClick={() => toggleApiKeyVisibility(provider.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showApiKeys[provider.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-slate-700">
                      {provider.selected_model || 'Não selecionado'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(provider)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditProvider(provider)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar provedor"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {provider.api_key_encrypted && (
                        <button
                          onClick={() => handleTestConnection(provider.id)}
                          disabled={testingProvider === provider.id}
                          className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Testar conexão"
                        >
                          {testingProvider === provider.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Key className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-slate-200 w-full">
          {providers.map((provider, index) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-4 space-y-3 w-full"
            >
              {/* Provider Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getProviderIcon(provider.name)}</span>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900">{provider.name}</h3>
                    {globalProvider === provider.name && (
                      <p className="text-xs text-blue-600 font-medium">Provedor Global</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(provider)}
              </div>

              {/* Provider Details */}
              <div className="space-y-3 text-sm w-full">
                <div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-medium">Chave de API:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded break-all flex-1">
                      {showApiKeys[provider.id] && provider.api_key_encrypted
                        ? provider.api_key_encrypted
                        : maskApiKey(provider.api_key_encrypted)
                      }
                    </span>
                      <div className="flex-shrink-0">
                    {provider.api_key_encrypted && (
                      <button
                        onClick={() => toggleApiKeyVisibility(provider.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showApiKeys[provider.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-medium">Modelo:</span>
                    <p className="text-slate-700">
                    {provider.selected_model || 'Não selecionado'}
                  </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center sm:justify-end gap-2 pt-2">
                <button
                  onClick={() => handleEditProvider(provider)}
                  className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                  title="Editar provedor"
                >
                  <Edit className="w-4 h-4" />
                  <span className="sm:hidden">Editar</span>
                </button>
                
                {provider.api_key_encrypted && (
                  <button
                    onClick={() => handleTestConnection(provider.id)}
                    disabled={testingProvider === provider.id}
                    className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 text-sm"
                    title="Testar conexão"
                  >
                    {testingProvider === provider.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4" />
                    )}
                    <span className="sm:hidden">
                      {testingProvider === provider.id ? 'Testando...' : 'Testar'}
                    </span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Provider Modal */}
      <AIProviderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProvider(null);
        }}
        onSave={handleUpdateProvider}
        provider={editingProvider}
        loading={loading}
      />
    </div>
  );
};

export default AIProviderManagement;