import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, Weight, Ruler, Target, Activity, Loader2, Heart, Bone, BookOpen, Utensils, Bot as Body, Plus, Trash2 } from 'lucide-react';
import { Runner } from '../../types/database';

interface RunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (runnerData: Partial<Runner>) => Promise<void>;
  runner?: Runner | null;
  loading: boolean;
}

interface Injury {
  nome: string;
  lado?: string;
  status?: string;
  observacoes?: string;
}

interface HealthCondition {
  nome: string;
  observacoes?: string;
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
    past_training_experience: '',
    dietary_preferences: '',
    pisada: '',
    biotipo: '',
    outras_caracteristicas: ''
  });

  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>([]);
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
          past_training_experience: runner.past_training_experience || '',
          dietary_preferences: runner.dietary_preferences || '',
          pisada: '',
          biotipo: '',
          outras_caracteristicas: ''
        });

        // Parse existing injuries
        try {
          const existingInjuries = runner.injuries ? (Array.isArray(runner.injuries) ? runner.injuries : JSON.parse(runner.injuries)) : [];
          setInjuries(existingInjuries);
        } catch {
          setInjuries([]);
        }

        // Parse existing health conditions
        try {
          const existingConditions = runner.health_conditions ? (Array.isArray(runner.health_conditions) ? runner.health_conditions : JSON.parse(runner.health_conditions)) : [];
          setHealthConditions(existingConditions);
        } catch {
          setHealthConditions([]);
        }

        // Parse existing physical characteristics
        try {
          const existingCharacteristics = runner.physical_characteristics ? (typeof runner.physical_characteristics === 'object' ? runner.physical_characteristics : JSON.parse(runner.physical_characteristics)) : {};
          setFormData(prev => ({
            ...prev,
            pisada: existingCharacteristics.pisada || '',
            biotipo: existingCharacteristics.biotipo || '',
            outras_caracteristicas: existingCharacteristics.outras || ''
          }));
        } catch {
          // Keep defaults
        }
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
          past_training_experience: '',
          dietary_preferences: '',
          pisada: '',
          biotipo: '',
          outras_caracteristicas: ''
        });
        setInjuries([]);
        setHealthConditions([]);
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

  // Injury management functions
  const addInjury = () => {
    setInjuries(prev => [...prev, { nome: '', lado: '', status: '', observacoes: '' }]);
  };

  const updateInjury = (index: number, field: keyof Injury, value: string) => {
    setInjuries(prev => prev.map((injury, i) => 
      i === index ? { ...injury, [field]: value } : injury
    ));
  };

  const removeInjury = (index: number) => {
    setInjuries(prev => prev.filter((_, i) => i !== index));
  };

  // Health condition management functions
  const addHealthCondition = () => {
    setHealthConditions(prev => [...prev, { nome: '', observacoes: '' }]);
  };

  const updateHealthCondition = (index: number, field: keyof HealthCondition, value: string) => {
    setHealthConditions(prev => prev.map((condition, i) => 
      i === index ? { ...condition, [field]: value } : condition
    ));
  };

  const removeHealthCondition = (index: number) => {
    setHealthConditions(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
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
      // Build physical characteristics object
      const physicalCharacteristics: any = {};
      if (formData.pisada) physicalCharacteristics.pisada = formData.pisada;
      if (formData.biotipo) physicalCharacteristics.biotipo = formData.biotipo;
      if (formData.outras_caracteristicas) physicalCharacteristics.outras = formData.outras_caracteristicas;

      // Filter out empty injuries and health conditions
      const validInjuries = injuries.filter(injury => injury.nome.trim());
      const validHealthConditions = healthConditions.filter(condition => condition.nome.trim());

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
        injuries: validInjuries.length > 0 ? validInjuries : null,
        health_conditions: validHealthConditions.length > 0 ? validHealthConditions : null,
        past_training_experience: formData.past_training_experience.trim() || null,
        physical_characteristics: Object.keys(physicalCharacteristics).length > 0 ? physicalCharacteristics : null,
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
                Observações Gerais
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Informações adicionais importantes sobre o corredor..."
              />
            </div>

            {/* Anamnese Detalhada */}
            <h3 className="text-lg font-semibold text-slate-900 mt-8 mb-4 border-t pt-6">
              Anamnese Detalhada
            </h3>

            {/* Histórico de Lesões */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-slate-700">
                  Histórico de Lesões
                </label>
                <button
                  type="button"
                  onClick={addInjury}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Lesão
                </button>
              </div>
              
              {injuries.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                  <Bone className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 text-sm">Nenhuma lesão registrada</p>
                  <button
                    type="button"
                    onClick={addInjury}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Adicionar primeira lesão
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {injuries.map((injury, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-slate-900">Lesão {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeInjury(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          placeholder="Nome da lesão (ex: joelho)"
                          value={injury.nome}
                          onChange={(e) => updateInjury(index, 'nome', e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        />
                        <select
                          value={injury.lado || ''}
                          onChange={(e) => updateInjury(index, 'lado', e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        >
                          <option value="">Lado (opcional)</option>
                          <option value="direito">Direito</option>
                          <option value="esquerdo">Esquerdo</option>
                          <option value="bilateral">Bilateral</option>
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <select
                          value={injury.status || ''}
                          onChange={(e) => updateInjury(index, 'status', e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        >
                          <option value="">Status (opcional)</option>
                          <option value="curado">Curado</option>
                          <option value="recuperando">Recuperando</option>
                          <option value="ativo">Ativo/Atual</option>
                          <option value="crônico">Crônico</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Observações"
                          value={injury.observacoes || ''}
                          onChange={(e) => updateInjury(index, 'observacoes', e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Condições de Saúde */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-slate-700">
                  Condições de Saúde
                </label>
                <button
                  type="button"
                  onClick={addHealthCondition}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Condição
                </button>
              </div>
              
              {healthConditions.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                  <Heart className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 text-sm">Nenhuma condição de saúde registrada</p>
                  <button
                    type="button"
                    onClick={addHealthCondition}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Adicionar primeira condição
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {healthConditions.map((condition, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-slate-900">Condição {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeHealthCondition(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Nome da condição (ex: asma, diabetes)"
                          value={condition.nome}
                          onChange={(e) => updateHealthCondition(index, 'nome', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        />
                        <textarea
                          placeholder="Observações e cuidados especiais"
                          value={condition.observacoes || ''}
                          onChange={(e) => updateHealthCondition(index, 'observacoes', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Experiência de Treino Passada */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Experiência de Treino Passada
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <textarea
                  name="past_training_experience"
                  value={formData.past_training_experience}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Ex: Corredor de rua há 5 anos, completou 3 maratonas, treina 4x por semana..."
                />
              </div>
            </div>

            {/* Características Físicas */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Características Físicas
              </label>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Tipo de Pisada
                    </label>
                    <select
                      name="pisada"
                      value={formData.pisada}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    >
                      <option value="">Selecione</option>
                      <option value="neutra">Neutra</option>
                      <option value="pronada">Pronada</option>
                      <option value="supinada">Supinada</option>
                      <option value="não avaliado">Não avaliado</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Biotipo
                    </label>
                    <select
                      name="biotipo"
                      value={formData.biotipo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    >
                      <option value="">Selecione</option>
                      <option value="ectomorfo">Ectomorfo</option>
                      <option value="mesomorfo">Mesomorfo</option>
                      <option value="endomorfo">Endomorfo</option>
                      <option value="não avaliado">Não avaliado</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Outras Características
                  </label>
                  <textarea
                    name="outras_caracteristicas"
                    value={formData.outras_caracteristicas}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm resize-none"
                    placeholder="Ex: flexibilidade baixa, força muscular boa, coordenação motora..."
                  />
                </div>
              </div>
            </div>

            {/* Preferências/Restrições Alimentares */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Preferências/Restrições Alimentares
              </label>
              <div className="relative">
                <Utensils className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <textarea
                  name="dietary_preferences"
                  value={formData.dietary_preferences}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Ex: Vegetariano, intolerante à lactose, não consome cafeína..."
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