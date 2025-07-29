import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Eye, EyeOff, CreditCard, AlertTriangle, Check } from 'lucide-react';

interface GatewayConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gatewayData: any) => Promise<boolean>;
  loading: boolean;
}

const GatewayConfigModal: React.FC<GatewayConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  loading
}) => {
  const [formData, setFormData] = useState({
    stripe_public_key: '',
    stripe_secret_key: '',
    mercadopago_public_key: '',
    mercadopago_access_token: ''
  });

  const [saving, setSaving] = useState(false);
  const [showSecretKeys, setShowSecretKeys] = useState({
    stripe: false,
    mercadopago: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        stripe_public_key: '',
        stripe_secret_key: '',
        mercadopago_public_key: '',
        mercadopago_access_token: ''
      });
      setErrors({});
      setShowSecretKeys({ stripe: false, mercadopago: false });
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validar Stripe
    if (formData.stripe_public_key && !formData.stripe_public_key.startsWith('pk_')) {
      newErrors.stripe_public_key = 'Chave pública do Stripe deve começar com "pk_"';
    }

    if (formData.stripe_secret_key && !formData.stripe_secret_key.startsWith('sk_')) {
      newErrors.stripe_secret_key = 'Chave secreta do Stripe deve começar com "sk_"';
    }

    // Validar Mercado Pago
    if (formData.mercadopago_public_key && !formData.mercadopago_public_key.startsWith('APP_USR_')) {
      newErrors.mercadopago_public_key = 'Chave pública do Mercado Pago deve começar com "APP_USR_"';
    }

    if (formData.mercadopago_access_token && !formData.mercadopago_access_token.startsWith('APP_USR_')) {
      newErrors.mercadopago_access_token = 'Token de acesso do Mercado Pago deve começar com "APP_USR_"';
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
    console.log('💾 GATEWAY MODAL: Iniciando salvamento das chaves...');
    console.log('💾 GATEWAY MODAL: Dados a serem salvos:', {
      stripe_public_key: formData.stripe_public_key ? 'PREENCHIDO' : 'VAZIO',
      stripe_secret_key: formData.stripe_secret_key ? 'PREENCHIDO' : 'VAZIO',
      mercadopago_public_key: formData.mercadopago_public_key ? 'PREENCHIDO' : 'VAZIO',
      mercadopago_access_token: formData.mercadopago_access_token ? 'PREENCHIDO' : 'VAZIO'
    });

    try {
      const success = await onSave(formData);
      if (success) {
        console.log('✅ GATEWAY MODAL: Chaves salvas com sucesso!');
        onClose();
      } else {
        console.error('❌ GATEWAY MODAL: Falha ao salvar chaves');
      }
    } catch (error) {
      console.error('❌ GATEWAY MODAL: Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleSecretKeyVisibility = (gateway: 'stripe' | 'mercadopago') => {
    setShowSecretKeys(prev => ({
      ...prev,
      [gateway]: !prev[gateway]
    }));
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Configurar Gateways de Pagamento
                </h2>
                <p className="text-blue-100">
                  Configure as chaves de API dos provedores de pagamento
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
                  As chaves secretas são criptografadas antes de serem armazenadas no banco de dados.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Stripe Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                Stripe
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Chave Pública (Publishable Key) *
                </label>
                <input
                  type="text"
                  name="stripe_public_key"
                  value={formData.stripe_public_key}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors font-mono text-sm ${
                    errors.stripe_public_key ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                  }`}
                  placeholder="pk_live_... ou pk_test_..."
                />
                {errors.stripe_public_key && (
                  <p className="mt-1 text-sm text-red-600">{errors.stripe_public_key}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Chave Secreta (Secret Key) *
                </label>
                <div className="relative">
                  <input
                    type={showSecretKeys.stripe ? 'text' : 'password'}
                    name="stripe_secret_key"
                    value={formData.stripe_secret_key}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors font-mono text-sm ${
                      errors.stripe_secret_key ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                    }`}
                    placeholder="sk_live_... ou sk_test_..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretKeyVisibility('stripe')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSecretKeys.stripe ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.stripe_secret_key && (
                  <p className="mt-1 text-sm text-red-600">{errors.stripe_secret_key}</p>
                )}
              </div>
            </div>

            {/* Mercado Pago Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <span className="text-blue-600 font-bold text-sm">MP</span>
                </div>
                Mercado Pago
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Chave Pública (Public Key)
                </label>
                <input
                  type="text"
                  name="mercadopago_public_key"
                  value={formData.mercadopago_public_key}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 transition-colors font-mono text-sm ${
                    errors.mercadopago_public_key ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-purple-500'
                  }`}
                  placeholder="APP_USR_..."
                />
                {errors.mercadopago_public_key && (
                  <p className="mt-1 text-sm text-red-600">{errors.mercadopago_public_key}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Token de Acesso (Access Token)
                </label>
                <div className="relative">
                  <input
                    type={showSecretKeys.mercadopago ? 'text' : 'password'}
                    name="mercadopago_access_token"
                    value={formData.mercadopago_access_token}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-purple-500 transition-colors font-mono text-sm ${
                      errors.mercadopago_access_token ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-purple-500'
                    }`}
                    placeholder="APP_USR_..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretKeyVisibility('mercadopago')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSecretKeys.mercadopago ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.mercadopago_access_token && (
                  <p className="mt-1 text-sm text-red-600">{errors.mercadopago_access_token}</p>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-800 font-medium text-sm">Como obter as chaves:</p>
                  <ul className="text-blue-700 text-xs mt-2 space-y-1">
                    <li><strong>Stripe:</strong> Dashboard → Developers → API keys</li>
                    <li><strong>Mercado Pago:</strong> Sua conta → Credenciais</li>
                  </ul>
                </div>
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
                <Save className="w-5 h-5" />
                Salvar Configurações
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GatewayConfigModal;