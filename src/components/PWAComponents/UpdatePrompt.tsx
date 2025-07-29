import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download, X } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

const UpdatePrompt: React.FC = () => {
  const { hasValidUpdate, autoUpdateEnabled } = usePWA();

  // ATUALIZAÇÃO AUTOMÁTICA: Nunca mostrar prompt pois atualizações são automáticas
  if (!hasValidUpdate || autoUpdateEnabled) {
    return null;
  }

  // Este componente agora só serve como fallback (nunca deve aparecer)
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
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Nova versão disponível</h3>
              <p className="text-sm text-slate-600">Atualize para ter as últimas melhorias</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 cursor-default"
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
  );
};

export default UpdatePrompt;