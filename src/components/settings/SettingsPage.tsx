import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, MessageSquare, AlertCircle, Check } from 'lucide-react';
import { useObservationTemplates } from '../../hooks/useObservationTemplates';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import TemplateModal from './TemplateModal';
import { ObservationTemplate } from '../../types/database';
import SubscriptionGuard from '../ui/SubscriptionGuard';

const SettingsPage: React.FC = () => {
  const { 
    templates, 
    loading, 
    error, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate 
  } = useObservationTemplates();
  const { canAccessFeature, blockingReason } = useSubscriptionGuard();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ObservationTemplate | null>(null);

  const handleCreateTemplate = async (templateData: Partial<ObservationTemplate>) => {
    const success = await createTemplate(templateData);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleUpdateTemplate = async (templateData: Partial<ObservationTemplate>) => {
    if (!editingTemplate) return;
    
    const success = await updateTemplate(editingTemplate.id, templateData);
    if (success) {
      setIsModalOpen(false);
      setEditingTemplate(null);
    }
  };

  const handleEditTemplate = (template: ObservationTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.')) {
      await deleteTemplate(templateId);
    }
  };

  const isAtLimit = templates.length >= 5;

  // BLOQUEIO TOTAL PARA PLANO RESTRITO
  if (!canAccessFeature && blockingReason) {
    return (
      <div className="p-6 lg:p-8">
        <SubscriptionGuard feature="general">
          <div></div>
        </SubscriptionGuard>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Configurações
        </h1>
        <p className="text-lg text-slate-600">
          Gerencie suas preferências e templates de observações
        </p>
      </motion.div>

      {/* Templates Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-slate-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              Meus Templates de Observações Rápidas
            </h2>
            <p className="text-slate-600">
              Crie até 5 atalhos de texto para as observações que você mais utiliza na edição de treinos.
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: isAtLimit ? 1 : 1.05 }}
            whileTap={{ scale: isAtLimit ? 1 : 0.95 }}
            onClick={() => {
              if (!isAtLimit) {
                setEditingTemplate(null);
                setIsModalOpen(true);
              }
            }}
            disabled={isAtLimit}
            className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 flex items-center gap-2 ${
              isAtLimit
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl'
            }`}
          >
            <Plus className="w-5 h-5" />
            Novo Template
          </motion.button>
        </div>

        {/* Limit Warning */}
        {isAtLimit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <p className="text-orange-700">
              Você atingiu o limite de 5 templates. Exclua um template existente para criar um novo.
            </p>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6"
          >
            Erro ao carregar templates: {error}
          </motion.div>
        )}

        {/* Templates List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-slate-500" />
            </div>
            
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nenhum template criado
            </h3>
            
            <p className="text-slate-600 mb-6 max-w-sm mx-auto">
              Crie seus primeiros templates de observações para agilizar a edição de treinos.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditingTemplate(null);
                setIsModalOpen(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              + Criar Primeiro Template
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-2">
                      {template.name}
                    </h4>
                    <p className="text-slate-700 whitespace-pre-line">
                      {template.content}
                    </p>
                    {template.category && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mt-2">
                        {template.category}
                      </span>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar template"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Templates Count */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              {templates.length} de 5 templates utilizados
            </span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-slate-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(templates.length / 5) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className={`h-2 rounded-full ${
                    templates.length >= 5 
                      ? 'bg-gradient-to-r from-orange-400 to-red-500' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-600'
                  }`}
                />
              </div>
              {templates.length >= 5 && (
                <Check className="w-4 h-4 text-orange-600" />
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Template Modal */}
      <TemplateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTemplate(null);
        }}
        onSave={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
        template={editingTemplate}
        loading={loading}
      />
    </div>
  );
};

export default SettingsPage;