import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { AuthError } from '@supabase/supabase-js';
import { useAuthContext } from '../../contexts/AuthContext';
import { useAppSettings } from '../../hooks/useAppSettings';
import { Link, useNavigate } from 'react-router-dom';

const SignupPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const { signUp } = useAuthContext();
  const navigate = useNavigate();
  const { settings, loading: appSettingsLoading, getTrialDuration } = useAppSettings();

  // DEBUG: Logs para rastrear o problema da duração do teste
  console.log('🔵 SIGNUP DEBUG: Render da SignupPage');
  console.log('🔵 SIGNUP DEBUG: appSettingsLoading:', appSettingsLoading);
  console.log('🔵 SIGNUP DEBUG: settings:', settings);
  console.log('🔵 SIGNUP DEBUG: getTrialDuration():', getTrialDuration());
  console.log('🔵 SIGNUP DEBUG: settings?.trial_duration_days:', settings?.trial_duration_days);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await signUp(formData.email, formData.password, formData.fullName);
      if (error) throw error;
      setSuccess('Conta criada com sucesso! Seu período de teste gratuito foi ativado automaticamente.');
      
      // Aguardar mais tempo para garantir que o perfil seja criado
      setTimeout(() => {
        console.log('🔄 SignupPage: Redirecionando para dashboard após cadastro...');
        navigate('/dashboard');
      }, 3000);
    } catch (err: any) {
      let errorMessage = 'Ocorreu um erro. Tente novamente.';
      
      // Verifica se é um AuthError do Supabase
      if (err instanceof AuthError) {
        try {
          // Acessa a propriedade json.body do AuthError
          if (err.json && err.json.body) {
            const bodyData = JSON.parse(err.json.body);
            if (bodyData.code === 'user_already_exists') {
              errorMessage = 'Este email já está cadastrado. Faça login ou use outro email.';
            } else if (bodyData.message) {
              errorMessage = bodyData.message;
            }
          }
        } catch (parseError) {
          errorMessage = err.message;
        }
      } else if (err.message && err.message.includes('Supabase request failed')) {
        try {
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Back to Home */}
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao início
          </Link>

          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Criar Conta Gratuita
            </h2>
            <p className="text-slate-600">
              {appSettingsLoading 
                ? 'Carregando...' 
                : `Comece seu teste gratuito de ${getTrialDuration()} dias`}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
            >
              {success}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              Criar Conta Gratuita
            </button>

            {/* Footer Links */}
            <div className="text-center">
              <p className="text-slate-600 text-sm">
                Já tem uma conta?{' '}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Fazer login
                </Link>
              </p>
            </div>

            <p className="text-xs text-slate-500 text-center">
              Ao criar uma conta, você concorda com nossos{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700">
              <Link
                to="/termos-de-uso"
                className="text-blue-600 hover:text-blue-700"
              >
                Termos de Uso
              </Link>
              </a>{' '}
              e{' '}
              <Link
                to="/politica-de-privacidade"
                className="text-blue-600 hover:text-blue-700"
              >
                Política de Privacidade
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;