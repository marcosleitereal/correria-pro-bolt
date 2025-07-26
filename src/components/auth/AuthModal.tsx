import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'signin' 
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const { signIn, signUp, resetPassword } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;
        onClose();
      } else if (mode === 'signup') {
        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) throw error;
        setSuccess('Conta criada com sucesso! Você já pode começar a usar a plataforma.');
        setTimeout(() => onClose(), 2000);
      } else if (mode === 'reset') {
        const { error } = await resetPassword(formData.email);
        if (error) throw error;
        setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.');
      }
    } catch (err: any) {
      let errorMessage = 'Ocorreu um erro. Tente novamente.';
      
      if (err.message && err.message.includes('Supabase request failed')) {
        try {
          // Extract JSON from the error message
          const jsonMatch = err.message.match(/\{.*\}/);
          if (jsonMatch) {
            const errorData = JSON.parse(jsonMatch[0]);
            if (errorData.body) {
              const bodyData = JSON.parse(errorData.body);
              if (bodyData.code === 'user_already_exists') {
                errorMessage = 'Este email já está cadastrado. Faça login ou use outro email.';
              } else if (bodyData.message) {
                errorMessage = bodyData.message;
              }
            }
          }
        } catch (parseError) {
          // If parsing fails, use the original error message
          errorMessage = err.message;
        }
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
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
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {mode === 'signin' && 'Entrar na Correria.Pro'}
              {mode === 'signup' && 'Criar Conta Gratuita'}
              {mode === 'reset' && 'Recuperar Senha'}
            </h2>
            <p className="text-slate-600">
              {mode === 'signin' && 'Acesse sua conta e continue treinando'}
              {mode === 'signup' && 'Comece seu teste gratuito de 14 dias'}
              {mode === 'reset' && 'Digite seu email para recuperar a senha'}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6"
            >
              {success}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Sua senha"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {mode === 'signin' && 'Entrar'}
              {mode === 'signup' && 'Criar Conta Gratuita'}
              {mode === 'reset' && 'Enviar Email'}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'signin' && (
              <>
                <button
                  onClick={() => setMode('reset')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Esqueceu sua senha?
                </button>
                <p className="text-slate-600 text-sm">
                  Não tem uma conta?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Criar conta gratuita
                  </button>
                </p>
              </>
            )}

            {mode === 'signup' && (
              <p className="text-slate-600 text-sm">
                Já tem uma conta?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Fazer login
                </button>
              </p>
            )}

            {mode === 'reset' && (
              <button
                onClick={() => setMode('signin')}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Voltar para o login
              </button>
            )}
          </div>

          {mode === 'signup' && (
            <p className="text-xs text-slate-500 text-center mt-4">
              Ao criar uma conta, você concorda com nossos{' '}
              <a href="/termos-de-uso" className="text-blue-600 hover:text-blue-700">
                Termos de Uso
              </a>{' '}
              e{' '}
              <a href="/politica-de-privacidade" className="text-blue-600 hover:text-blue-700">
                Política de Privacidade
              </a>
            </p>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;