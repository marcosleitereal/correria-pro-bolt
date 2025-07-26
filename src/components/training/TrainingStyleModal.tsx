import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, FileText, Loader2, Zap, Tag } from 'lucide-react';
import { TrainingStyle } from '../../types/database';

interface TrainingStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (styleData: Partial<TrainingStyle>) => Promise<void>;
  style?: TrainingStyle | null;
  loading: boolean;
}

const TrainingStyleModal: React.FC<TrainingStyleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  style,
  loading
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    intensity: 'moderada' as const,
    category: ''
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or style changes
  useEffect(() => {
    if (isOpen) {
      if (style) {
        setFormData({
          name: style.name || '',
          description: style.description || '',
          duration: style.duration || '',
          intensity: style.intensity || 'moderada',
          category: style.category || ''
        });
      } else {
        setFormData({
          name: '',
          description: '',
          duration: '',
          intensity: 'moderada',
          category: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, style]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      newErrors.name = 'Nome do estilo é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
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
      const styleData: Partial<TrainingStyle> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        duration: formData.duration.trim() || null,
        intensity: formData.intensity,
        category: formData.category.trim() || null
      };

      await onSave(styleData);
    } catch (error) {
      console.error('Erro ao salvar estilo:', error);
    } finally {
      setSaving(false);
    }
  };

  const intensityOptions = [
    { value: 'muito_baixa', label: 'Muito Baixa' },
    { value: 'baixa', label: 'Baixa' },
    { value: 'moderada', label: 'Moderada' },
    { value: 'moderada_alta', label: 'Moderada Alta' },
    { value: 'alta', label: 'Alta' },
    { value: 'muito_alta', label: 'Muito Alta' }
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
          {/* Cabeçalho */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {style ? 'Editar Estilo' : 'Novo Estilo'}
                </h2>
                <p className="text-blue-100">
                  {style ? 'Atualize as informações do estilo' : 'Crie um novo estilo de treino'}
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

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Nome do Estilo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome do Estilo *
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.name ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                  }`}
                  placeholder="Ex: Treino Intervalado de Velocidade"
                  required
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descrição *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors resize-none ${
                    errors.description ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                  }`}
                  placeholder="Descreva a metodologia e objetivos deste estilo de treino..."
                  required
                />
              </div>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Duração e Intensidade */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Duração Típica
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: 60 minutos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Intensidade *
                </label>
                <div className="relative">
                  <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <select
                    name="intensity"
                    value={formData.intensity}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    {intensityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Categoria
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: Velocidade, Resistência, Recuperação"
                />
              </div>
            </div>
          </form>

          {/* Rodapé */}
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
                {style ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TrainingStyleModal;