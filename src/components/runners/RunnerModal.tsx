import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, Weight, Ruler, Target, Activity, Loader2, Heart, Bone, BookOpen, Utensils, Body } from 'lucide-react';
import { Runner } from '../../types/database';

interface RunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (runnerData: Partial<Runner>) => Promise<void>;
  runner?: Runner | null;
  loading: boolean;
}

const RunnerModal: React.FC<RunnerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  runner,
  loading
}) => {
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    gender: '',
    weight_kg: '',
    height_cm: '',
    main_goal: '',
    fitness_level: 'beginner' as const,
    resting_heart_rate: '',
    max_heart_rate: '',
    notes: '',
    injuries: '', // JSON string
    health_conditions: '', // JSON string
    past_training_experience: '',
    physical_characteristics: '', // JSON string
    dietary_preferences: ''
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or runner changes
  useEffect(() => {
    if (isOpen) {
      if (runner) {
        setFormData({
          name: runner.name || '',
          birth_date: runner.birth_date || '',
          gender: runner.gender || '',
          weight_kg: runner.weight_kg?.toString() || '',
          height_cm: runner.height_cm?.toString() || '',
          main_goal: runner.main_goal || '',
          fitness_level: runner.fitness_level || 'beginner',
          resting_heart_rate: runner.resting_heart_rate?.toString() || '',
          max_heart_rate: runner.max_heart_rate?.toString() || '',
          notes: runner.notes || '',
          injuries: JSON.stringify(runner.injuries || [], null, 2),
          health_conditions: JSON.stringify(runner.health_conditions || [], null, 2),
          past_training_experience: runner.past_training_experience || '',
          physical_characteristics: JSON.stringify(runner.physical_characteristics || {}, null, 2),
          dietary_preferences: runner.dietary_preferences || ''
        });
      } else {
        setFormData({
          name: '',
          birth_date: '',
          gender: '',
          weight_kg: '',
          height_cm: '',
          main_goal: '',
          fitness_level: 'beginner',
          resting_heart_rate: '',
          max_heart_rate: '',
          notes: '',
          injuries: '',
          health_conditions: '',
          past_training_experience: '',
          physical_characteristics: '',
          dietary_preferences: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, runner]);

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
      newErrors.name = 'Nome é obrigatório';
    }
    
    // Validate JSON fields
    const jsonFields = ['injuries', 'health_conditions', 'physical_characteristics'];
    jsonFields.forEach(field => {
      if (formData[field as keyof typeof formData]) {
        try {
          JSON.parse(formData[field as keyof typeof formData]);
        } catch {
          newErrors[field] = `Formato JSON inválido para ${field.replace('_', ' ')}`;
        }
      }
    });

    // Validate required fields for JSON if they are not empty
    if (newErrors.injuries && formData.injuries.trim()) {
      newErrors.injuries = 'Formato JSON inválido para lesões. Ex: [{"nome": "joelho", "lado": "direito"}]';
    }
    if (newErrors.health_conditions && formData.health_conditions.trim()) {
      newErrors.health_conditions = 'Formato JSON inválido para condições de saúde. Ex: [{"nome": "asma"}]';
    }

    if (!formData.birth_date) {
      newErrors.birth_date = 'Data de nascimento é obrigatória';
    }

    if (formData.weight_kg && (isNaN(Number(formData.weight_kg)) || Number(formData.weight_kg) <= 0)) {
      newErrors.weight_kg = 'Peso deve ser um número válido';
    }

    if (formData.height_cm && (isNaN(Number(formData.height_cm)) || Number(formData.height_cm) <= 0)) {
      newErrors.height_cm = 'Altura deve ser um número válido';
    }

    if (formData.resting_heart_rate && (isNaN(Number(formData.resting_heart_rate)) || Number(formData.resting_heart_rate) <= 0)) {
      newErrors.resting_heart_rate = 'Frequência cardíaca de repouso deve ser um número válido';
    }

    if (formData.max_heart_rate && (isNaN(Number(formData.max_heart_rate)) || Number(formData.max_heart_rate) <= 0)) {
      newErrors.max_heart_rate = 'Frequência cardíaca máxima deve ser um número válido';
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
      const runnerData: Partial<Runner> = {
        name: formData.name.trim(),
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        weight_kg: formData.weight_kg ? Number(formData.weight_kg) : null,
        height_cm: formData.height_cm ? Number(formData.height_cm) : null,
        main_goal: formData.main_goal.trim() || null,
        fitness_level: formData.fitness_level,
        resting_heart_rate: formData.resting_heart_rate ? Number(formData.resting_heart_rate) : null,
        max_heart_rate: formData.max_heart_rate ? Number(formData.max_heart_rate) : null,
        notes: formData.notes.trim() || null,
        injuries: formData.injuries ? JSON.parse(formData.injuries) : null,
        health_conditions: formData.health_conditions ? JSON.parse(formData.health_conditions) : null,
        past_training_experience: formData.past_training_experience.trim() || null,
        physical_characteristics: formData.physical_characteristics ? JSON.parse(formData.physical_characteristics) : null,
        dietary_preferences: formData.dietary_preferences.trim() || null
      };

      await onSave(runnerData);
    } catch (error) {
      console.error('Error saving runner:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end p-4 z-50">
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white w-full max-w-lg h-full rounded-l-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {runner ? 'Editar Corredor' : 'Novo Corredor'}
                </h2>
                <p className="text-blue-100">
                  {runner ? 'Atualize as informações do atleta' : 'Adicione um novo atleta à sua equipe'}
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.name ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                  }`}
                  placeholder="Nome do corredor"
                  required
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data de Nascimento *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.birth_date ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                  }`}
                  required
                />
              </div>
              {errors.birth_date && (
                <p className="mt-1 text-sm text-red-600">{errors.birth_date}</p>
              )}
            </div>

            {/* Gênero */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gênero
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Selecione o gênero</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            {/* Peso e Altura */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Peso (kg)
                </label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="number"
                    name="weight_kg"
                    value={formData.weight_kg}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.weight_kg ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                    }`}
                    placeholder="70"
                    min="1"
                    step="0.1"
                  />
                </div>
                {errors.weight_kg && (
                  <p className="mt-1 text-sm text-red-600">{errors.weight_kg}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Altura (cm)
                </label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="number"
                    name="height_cm"
                    value={formData.height_cm}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.height_cm ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                    }`}
                    placeholder="175"
                    min="1"
                  />
                </div>
                {errors.height_cm && (
                  <p className="mt-1 text-sm text-red-600">{errors.height_cm}</p>
                )}
              </div>
            </div>

            {/* Meta Principal */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Meta Principal
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="main_goal"
                  value={formData.main_goal}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: Correr uma maratona em 4h"
                />
              </div>
            </div>

            {/* Nível de Condicionamento */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nível de Condicionamento
              </label>
              <select
                name="fitness_level"
                value={formData.fitness_level}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermediário</option>
                <option value="advanced">Avançado</option>
                <option value="professional">Profissional</option>
              </select>
            </div>

            {/* Frequências Cardíacas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  FC Repouso (bpm)
                </label>
                <div className="relative">
                  <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="number"
                    name="resting_heart_rate"
                    value={formData.resting_heart_rate}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.resting_heart_rate ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                    }`}
                    placeholder="60"
                    min="30"
                    max="120"
                  />
                </div>
                {errors.resting_heart_rate && (
                  <p className="mt-1 text-sm text-red-600">{errors.resting_heart_rate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  FC Máxima (bpm)
                </label>
                <div className="relative">
                  <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="number"
                    name="max_heart_rate"
                    value={formData.max_heart_rate}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.max_heart_rate ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                    }`}
                    placeholder="180"
                    min="120"
                    max="220"
                  />
                </div>
                {errors.max_heart_rate && (
                  <p className="mt-1 text-sm text-red-600">{errors.max_heart_rate}</p>
                )}
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Observações
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Informações adicionais sobre o corredor..."
              />
            </div>

            {/* Novas Seções de Anamnese */}
            <h3 className="text-lg font-semibold text-slate-900 mt-8 mb-4 border-t pt-6">
              Anamnese Detalhada
            </h3>

            {/* Lesões */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Histórico de Lesões (JSON)
              </label>
              <div className="relative">
                <Bone className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <textarea
                  name="injuries"
                  value={formData.injuries}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none font-mono text-sm ${
                    errors.injuries ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                  }`}
                  placeholder='Ex: [{"nome": "joelho", "lado": "direito", "status": "recuperando"}]'
                />
              </div>
              {errors.injuries && (
                <p className="mt-1 text-sm text-red-600">{errors.injuries}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Formato JSON. Ex: `[{"nome": "joelho", "lado": "direito", "status": "recuperando"}]`
              </p>
            </div>

            {/* Condições de Saúde */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Condições de Saúde (JSON)
              </label>
              <div className="relative">
                <Heart className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <textarea
                  name="health_conditions"
                  value={formData.health_conditions}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none font-mono text-sm ${
                    errors.health_conditions ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                  }`}
                  placeholder='Ex: [{"nome": "asma", "observacoes": "usar bombinha antes do treino"}]'
                />
              </div>
              {errors.health_conditions && (
                <p className="mt-1 text-sm text-red-600">{errors.health_conditions}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Formato JSON. Ex: `[{"nome": "asma", "observacoes": "usar bombinha antes do treino"}]`
              </p>
            </div>

            {/* Experiência de Treino Passada */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Experiência de Treino Passada
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="past_training_experience"
                  value={formData.past_training_experience}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: Corredor de rua há 5 anos, completou 3 maratonas."
                />
              </div>
            </div>

            {/* Características Físicas */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Características Físicas (JSON)
              </label>
              <div className="relative">
                <Body className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <textarea
                  name="physical_characteristics"
                  value={formData.physical_characteristics}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none font-mono text-sm ${
                    errors.physical_characteristics ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                  }`}
                  placeholder='Ex: {"pisada": "pronada", "biotipo": "ectomorfo"}'
                />
              </div>
              {errors.physical_characteristics && (
                <p className="mt-1 text-sm text-red-600">{errors.physical_characteristics}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Formato JSON. Ex: `{"pisada": "pronada", "biotipo": "ectomorfo"}`
              </p>
            </div>

            {/* Preferências Alimentares */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Preferências/Restrições Alimentares
              </label>
              <div className="relative">
                <Utensils className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="dietary_preferences"
                  value={formData.dietary_preferences}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: Vegetariano, não consome laticínios."
                />
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
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                {runner ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RunnerModal;