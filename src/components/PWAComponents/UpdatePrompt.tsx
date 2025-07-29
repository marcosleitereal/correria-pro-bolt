import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download, X } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

const UpdatePrompt: React.FC = () => {
  const { hasValidUpdate, updateApp, dismissUpdate } = usePWA();

  const handleUpdate = async () => {
    console.log('🔄 UpdatePrompt: Usuário clicou em atualizar');
    try {
      await updateApp();
      // Não definir estado aqui pois a página será recarregada
    } catch (error) {
      console.error('❌ UpdatePrompt: Erro ao atualizar:', error);
    }
  };

  const handleDismiss = () => {
    console.log('🔇 UpdatePrompt: Usuário dispensou a atualização');
    dismissUpdate();
  };

  // CRÍTICO: Só mostrar se hasValidUpdate for verdadeiro E se há service worker ativo
  if (!hasValidUpdate || !navigator.serviceWorker?.controller) {
    console.log('🚫 UpdatePrompt: Não exibindo - hasValidUpdate:', hasValidUpdate, 'controller:', !!navigator.serviceWorker?.controller);
    return null;
  }

  console.log('📢 UpdatePrompt: Renderizando prompt de atualização');

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
                className="text-slate-500 hover:text-slate-700 p-1 rounded transition-colors"
                title="Dispensar por 30 minutos"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleUpdate}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:scale-105 transition-transform duration-300 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Atualizar
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdatePrompt;