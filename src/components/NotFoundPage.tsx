import React from 'react';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const handleGoBack = () => {
    navigate(-1);
  };

  const getHomeLink = () => {
    return user ? '/dashboard' : '/';
  };

  const getHomeText = () => {
    return user ? 'Voltar para o Dashboard' : 'Voltar para o Início';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Animated 404 Number */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-9xl font-extrabold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              404
            </h1>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Ops! Página não encontrada
            </h2>
            <p className="text-lg text-slate-600 mb-2">
              Parece que você pegou um atalho que não existe.
            </p>
            <p className="text-slate-500">
              A página que você está procurando pode ter sido movida, excluída ou nunca existiu.
            </p>
          </motion.div>

          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-16 h-16 text-blue-600" />
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="space-y-4"
          >
            <Link
              to={getHomeLink()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-3"
            >
              <Home className="w-6 h-6" />
              {getHomeText()}
            </Link>

            <button
              onClick={handleGoBack}
              className="w-full border-2 border-slate-300 text-slate-700 py-4 px-8 rounded-xl font-semibold text-lg hover:border-slate-400 hover:bg-slate-100 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <ArrowLeft className="w-6 h-6" />
              Voltar à Página Anterior
            </button>
          </motion.div>

          {/* Helpful Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-12"
          >
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center justify-center gap-2">
                <Search className="w-5 h-5" />
                Páginas Populares
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="text-blue-600 hover:text-blue-700 transition-colors p-2 rounded-lg hover:bg-blue-50"
                    >
                      📊 Dashboard
                    </Link>
                    <Link
                      to="/runners"
                      className="text-blue-600 hover:text-blue-700 transition-colors p-2 rounded-lg hover:bg-blue-50"
                    >
                      🏃‍♂️ Meus Corredores
                    </Link>
                    <Link
                      to="/dashboard/generate-training"
                      className="text-blue-600 hover:text-blue-700 transition-colors p-2 rounded-lg hover:bg-blue-50"
                    >
                      ⚡ Gerar Treino
                    </Link>
                    <Link
                      to="/settings"
                      className="text-blue-600 hover:text-blue-700 transition-colors p-2 rounded-lg hover:bg-blue-50"
                    >
                      ⚙️ Configurações
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/"
                      className="text-blue-600 hover:text-blue-700 transition-colors p-2 rounded-lg hover:bg-blue-50"
                    >
                      🏠 Página Inicial
                    </Link>
                    <Link
                      to="/pricing"
                      className="text-blue-600 hover:text-blue-700 transition-colors p-2 rounded-lg hover:bg-blue-50"
                    >
                      💰 Preços
                    </Link>
                    <Link
                      to="/login"
                      className="text-blue-600 hover:text-blue-700 transition-colors p-2 rounded-lg hover:bg-blue-50"
                    >
                      🔐 Fazer Login
                    </Link>
                    <Link
                      to="/signup"
                      className="text-blue-600 hover:text-blue-700 transition-colors p-2 rounded-lg hover:bg-blue-50"
                    >
                      ✨ Criar Conta
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Brand Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-8 text-center"
          >
            <Link to="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Correria.Pro
              </h1>
            </Link>
            <p className="text-slate-500 text-sm mt-2">
              A plataforma definitiva para treinadores de corrida
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;