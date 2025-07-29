import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

const UpdatePrompt: React.FC = () => {
  const { hasUpdate, updateApp } = usePWA();
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateApp();
      // Não definir isUpdating como false aqui pois a página será recarregada
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Esconder por 30 minutos
    setTimeout(() => {
      setDismissed(false);
    }, 30 * 60 * 1000);
  };

  // Só mostrar se realmente há uma atualização e não foi dispensado
  if (!hasUpdate || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Nova versão disponível</h3>
              <p className="text-sm text-slate-600">Atualize para ter as últimas melhorias</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDismiss}
                className="text-slate-500 hover:text-slate-700 px-2 py-1 text-sm"
              >
                ✕
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:scale-105 transition-transform duration-300 flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Atualizando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Atualizar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdatePrompt;