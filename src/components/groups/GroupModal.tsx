import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, FileText, Loader2, Trash2 } from 'lucide-react';
import { TrainingGroup } from '../../types/database';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (groupData: Partial<TrainingGroup>) => Promise<void>;
  onDelete?: () => Promise<void>;
  group?: TrainingGroup | null;
  loading: boolean;
}

const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  group,
  loading
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: '' as 'iniciante' | 'intermediario' | 'avancado' | '',
    status: 'ativo' as 'ativo' | 'inativo'
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or group changes
  useEffect(() => {
    if (isOpen) {
      if (group) {
        setFormData({
          name: group.name || '',
          description: group.description || '',
          level: group.level || '',
          status: group.status || 'ativo'
        });
      } else {
        setFormData({
          name: '',
          description: '',
          level: '',
          status: 'ativo'
        });
      }
      setErrors({});
    }
  }, [isOpen, group]);

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
      newErrors.name = 'Nome do grupo é obrigatório';
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
      const groupData: Partial<TrainingGroup> = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        level: formData.level || null,
        status: formData.status
      };

      await onSave(groupData);
    } catch (error) {
      console.error('Error saving group:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !group) return;

    setDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error('Error deleting group:', error);
    } finally {
      setDeleting(false);
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {group ? 'Editar Grupo' : 'Novo Grupo'}
                </h2>
                <p className="text-blue-100">
                  {group ? 'Atualize as informações do grupo' : 'Crie um novo grupo de treino'}
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
            {/* Nome do Grupo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome do Grupo *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.name ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                  }`}
                  placeholder="Ex: Grupo Maratona SP"
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
                Descrição
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Descreva o objetivo e características deste grupo..."
                />
              </div>
            </div>

            {/* Nível */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nível do Grupo
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Selecione o nível</option>
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="avancado">Avançado</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </form>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <div className="flex gap-3">
              {group && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || saving}
                  className="px-4 py-3 border border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              )}
              
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
                {group ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GroupModal;