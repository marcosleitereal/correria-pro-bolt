import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { isSupabaseConfigured, getSupabaseConfig } from '../../lib/supabase';

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { signIn } = useAuthContext();
  const navigate = useNavigate();

  // Verificar configuração do Supabase
  const supabaseConfig = getSupabaseConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se Supabase está configurado antes de tentar login
    if (!isSupabaseConfigured()) {
      setError('Sistema não configurado. As variáveis de ambiente do Supabase não estão definidas no Netlify.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 LOGIN: Iniciando processo de login...');
      
      const { error } = await signIn(formData.email, formData.password);
      if (error) throw error;
      
      // Aguardar um momento para garantir que o perfil seja carregado
      setTimeout(() => {
        console.log('🔄 LoginPage: Redirecionando para dashboard após login...');
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      console.error('❌ LOGIN: Erro no processo de login:', err);
      
      let errorMessage = 'Ocorreu um erro. Tente novamente.';
      
      if (err.message) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else if (err.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
        } else if (err.message.includes('Supabase não está configurado')) {
          errorMessage = 'Erro de configuração do sistema. Contate o suporte.';
        } else {
          errorMessage = err.message;
        }
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
            {!isSupabaseConfigured() && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                <p className="font-medium">⚠️ Sistema não configurado</p>
                <p className="text-sm">Configure as variáveis de ambiente no Netlify:</p>
                <ul className="text-xs mt-2 list-disc list-inside">
                  <li>VITE_SUPABASE_URL</li>
                  <li>VITE_SUPABASE_ANON_KEY</li>
                </ul>
              </div>
            )}
            
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Login Administrativo
            </h2>
            <p className="text-slate-600">
              Área restrita para administradores
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
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
              disabled={loading || !isSupabaseConfigured()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {!isSupabaseConfigured() ? 'Sistema não configurado' : 'Entrar'}
            </button>

            {/* Footer Links */}
            <div className="text-center space-y-2">
              <Link
                to="/reset-password"
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Esqueceu sua senha?
              </Link>
              <div className="space-y-2">
                <p className="text-slate-600 text-sm">
                  É treinador?{' '}
                  <Link
                    to="/whatsapp-login"
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    Entrar com WhatsApp
                  </Link>
                </p>
                <p className="text-slate-600 text-sm">
                  Não tem uma conta administrativa?{' '}
                  <Link
                    to="/signup"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Criar conta gratuita
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
