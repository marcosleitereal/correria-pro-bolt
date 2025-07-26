import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  loading = false
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          bgColor: 'bg-gradient-to-r from-red-500 to-red-600',
          iconColor: 'text-red-600',
          buttonColor: 'bg-gradient-to-r from-red-500 to-red-600',
          icon: Trash2
        };
      case 'warning':
        return {
          bgColor: 'bg-gradient-to-r from-yellow-500 to-orange-600',
          iconColor: 'text-yellow-600',
          buttonColor: 'bg-gradient-to-r from-yellow-500 to-orange-600',
          icon: AlertTriangle
        };
      default:
        return {
          bgColor: 'bg-gradient-to-r from-blue-500 to-purple-600',
          iconColor: 'text-blue-600',
          buttonColor: 'bg-gradient-to-r from-blue-500 to-purple-600',
          icon: AlertTriangle
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className={`${config.bgColor} text-white p-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {title}
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="text-white hover:text-opacity-80 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className={`${config.iconColor} bg-opacity-10 p-3 rounded-full flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${config.iconColor}`} />
              </div>
              <div>
                <p className="text-slate-700 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 ${config.buttonColor} text-white px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2`}
              >
                {loading && (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmationModal;