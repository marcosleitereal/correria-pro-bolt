import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Users, FileText, Loader2, CreditCard } from 'lucide-react';
import { Plan } from '../../types/database';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (planData: Partial<Plan>) => Promise<void>;
  plan?: Plan | null;
  loading: boolean;
}

const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  plan,
  loading
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_monthly: '',
    max_athletes: '',
    is_active: true,
    stripe_price_id_monthly: '',
    mercadopago_plan_id: ''
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or plan changes
  useEffect(() => {
    if (isOpen && plan) {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        price_monthly: plan.price_monthly?.toString() || '',
        max_athletes: plan.max_athletes === -1 ? '' : plan.max_athletes?.toString() || '',
        is_active: plan.is_active ?? true,
        stripe_price_id_monthly: plan.stripe_price_id_monthly || '',
        mercadopago_plan_id: plan.mercadopago_plan_id || ''
      });
      setErrors({});
    }
  }, [isOpen, plan]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do plano é obrigatório';
    }

    if (!formData.price_monthly || isNaN(Number(formData.price_monthly)) || Number(formData.price_monthly) < 0) {
      newErrors.price_monthly = 'Preço deve ser um número válido';
    }

    if (formData.max_athletes && (isNaN(Number(formData.max_athletes)) || Number(formData.max_athletes) < 1)) {
      newErrors.max_athletes = 'Limite de atletas deve ser um número válido maior que 0';
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
      const planData: Partial<Plan> = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price_monthly: Number(formData.price_monthly),
        max_athletes: formData.max_athletes ? Number(formData.max_athletes) : -1, // -1 for unlimited
        is_active: formData.is_active,
        stripe_price_id_monthly: formData.stripe_price_id_monthly.trim() || null,
        mercadopago_plan_id: formData.mercadopago_plan_id.trim() || null
      };

      await onSave(planData);
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !plan) return null;

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
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Editar Plano
                </h2>
                <p className="text-green-100">
                  Atualize as configurações do plano de assinatura
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-green-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Nome do Plano */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome do Plano *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 transition-colors ${
                    errors.name ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-green-500'
                  }`}
                  placeholder="Ex: Plano Profissional"
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
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                placeholder="Descrição detalhada do plano..."
              />
            </div>

            {/* Preço e Limite */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Preço Mensal (R$) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="number"
                    name="price_monthly"
                    value={formData.price_monthly}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 transition-colors ${
                      errors.price_monthly ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-green-500'
                    }`}
                    placeholder="29.90"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                {errors.price_monthly && (
                  <p className="mt-1 text-sm text-red-600">{errors.price_monthly}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Limite de Atletas
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="number"
                    name="max_athletes"
                    value={formData.max_athletes}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 transition-colors ${
                      errors.max_athletes ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-green-500'
                    }`}
                    placeholder="Deixe vazio para ilimitado"
                    min="1"
                  />
                </div>
                {errors.max_athletes && (
                  <p className="mt-1 text-sm text-red-600">{errors.max_athletes}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Deixe vazio para atletas ilimitados
                </p>
              </div>
            </div>

            {/* IDs dos Gateways */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900 border-t border-slate-200 pt-4">
                IDs dos Gateways de Pagamento
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Stripe Price ID
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    name="stripe_price_id_monthly"
                    value={formData.stripe_price_id_monthly}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors font-mono text-sm"
                    placeholder="price_..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mercado Pago Plan ID
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    name="mercadopago_plan_id"
                    value={formData.mercadopago_plan_id}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors font-mono text-sm"
                    placeholder="plan_..."
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
              />
              <label className="text-sm font-medium text-slate-700">
                Plano ativo e disponível para assinatura
              </label>
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
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                Salvar Plano
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PlanModal;