import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Loader2, Tag } from 'lucide-react';
import { ObservationTemplate } from '../../types/database';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateData: Partial<ObservationTemplate>) => Promise<void>;
  template?: ObservationTemplate | null;
  loading: boolean;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  template,
  loading
}) => {
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: ''
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or template changes
  useEffect(() => {
    if (isOpen) {
      if (template) {
        setFormData({
          name: template.name || '',
          content: template.content || '',
          category: template.category || ''
        });
      } else {
        setFormData({
          name: '',
          content: '',
          category: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, template]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do template é obrigatório';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Conteúdo do template é obrigatório';
    }

    if (formData.content.trim().length > 500) {
      newErrors.content = 'Conteúdo deve ter no máximo 500 caracteres';
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
      const templateData: Partial<ObservationTemplate> = {
        name: formData.name.trim(),
        content: formData.content.trim(),
        category: formData.category.trim() || null
      };

      await onSave(templateData);
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = [
    { value: '', label: 'Sem categoria' },
    { value: 'geral', label: 'Geral' },
    { value: 'aquecimento', label: 'Aquecimento' },
    { value: 'treino_principal', label: 'Treino Principal' },
    { value: 'volta_calma', label: 'Volta à Calma' },
    { value: 'recuperacao', label: 'Recuperação' },
    { value: 'monitoramento', label: 'Monitoramento' },
    { value: 'nutricao', label: 'Nutrição' },
    { value: 'equipamentos', label: 'Equipamentos' }
  ];

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
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {template ? 'Editar Template' : 'Novo Template'}
                </h2>
                <p className="text-blue-100">
                  {template ? 'Atualize o conteúdo do template' : 'Crie um novo template de observação'}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Nome do Template */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome do Template *
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.name ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                  }`}
                  placeholder="Ex: Hidratação, Aquecimento, Recuperação"
                  required
                  maxLength={50}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Categoria
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Conteúdo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Conteúdo do Template *
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={6}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors resize-none ${
                    errors.content ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                  }`}
                  placeholder="Digite o texto que será inserido automaticamente nos treinos..."
                  required
                  maxLength={500}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                {errors.content ? (
                  <p className="text-sm text-red-600">{errors.content}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Este texto será inserido nos campos de observação durante a edição de treinos.
                  </p>
                )}
                <span className="text-xs text-slate-500">
                  {formData.content.length}/500
                </span>
              </div>
            </div>

            {/* Preview */}
            {formData.content && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Prévia:</h4>
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <p className="text-slate-700 whitespace-pre-line text-sm">
                    {formData.content}
                  </p>
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
                {template ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TemplateModal;