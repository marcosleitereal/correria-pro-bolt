import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Zap, Shield, Wifi } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import { useAuthContext } from '../../contexts/AuthContext';

const InstallPrompt: React.FC = () => {
  const { canInstall, installApp, isInstalled } = usePWA();
  const { user } = useAuthContext();
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  // Chave para localStorage baseada no usuário
  const getStorageKey = () => {
    return user ? `pwa-install-prompt-${user.id}` : 'pwa-install-prompt-guest';
  };

  // Verificar se já foi mostrado nos últimos 30 dias
  const shouldShowPrompt = () => {
    if (!user || !canInstall || isInstalled) {
      return false;
    }

    const storageKey = getStorageKey();
    const lastShown = localStorage.getItem(storageKey);
    
    if (!lastShown) {
      return true; // Primeira vez
    }

    const lastShownDate = new Date(lastShown);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return lastShownDate < thirtyDaysAgo;
  };

  React.useEffect(() => {
    // Mostrar prompt apenas para usuários logados, após 10 segundos, respeitando frequência de 30 dias
    if (shouldShowPrompt() && !hasShown) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
        setHasShown(true);
        
        // Registrar que foi mostrado
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, new Date().toISOString());
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [user, canInstall, hasShown, isInstalled]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    
    // Registrar que foi dispensado (para respeitar os 30 dias)
    if (user) {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, new Date().toISOString());
    }
    
    setHasShown(true);
  };

  // Não mostrar se não for usuário logado, não for instalável, já estiver instalado ou não deve mostrar
  if (!user || !canInstall || isInstalled || !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 relative">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-white hover:text-blue-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center">
              <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Instalar Correria Pro
              </h2>
              <p className="text-blue-100">
                Tenha acesso rápido e offline ao seu app
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Acesso Instantâneo</h3>
                <p className="text-sm text-slate-600">Abra direto da tela inicial</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Wifi className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Funciona Offline</h3>
                <p className="text-sm text-slate-600">Use mesmo sem internet</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Seguro e Rápido</h3>
                <p className="text-sm text-slate-600">Performance nativa</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 pt-0 space-y-3">
            <button
              onClick={handleInstall}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Instalar Aplicativo
            </button>
            
            <button
              onClick={handleDismiss}
              className="w-full text-slate-600 py-2 px-6 rounded-lg font-medium hover:bg-slate-100 transition-colors"
            >
              Agora não
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPrompt;