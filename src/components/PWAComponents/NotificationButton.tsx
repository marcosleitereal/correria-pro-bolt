import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useOneSignal } from '../../hooks/useOneSignal';
import { toast } from 'sonner';

interface NotificationButtonProps {
  variant?: 'icon' | 'button';
  className?: string;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({
  variant = 'icon',
  className = ''
}) => {
  const { 
    isInitialized, 
    isSubscribed, 
    permission, 
    requestPermission, 
    subscribe, 
    unsubscribe,
    canSubscribe 
  } = useOneSignal();
  
  const [loading, setLoading] = useState(false);

  const handleToggleNotifications = async () => {
    if (!isInitialized) {
      toast.error('Sistema de notificações não está pronto');
      return;
    }

    setLoading(true);

    try {
      if (!isSubscribed) {
        // Solicitar permissão e inscrever
        if (permission === 'default') {
          const granted = await requestPermission();
          if (!granted) {
            toast.error('Permissão de notificação negada');
            return;
          }
        }

        const subscribed = await subscribe();
        if (subscribed) {
          toast.success('Notificações ativadas com sucesso!');
        } else {
          toast.error('Erro ao ativar notificações');
        }
      } else {
        // Desinscrever
        const unsubscribed = await unsubscribe();
        if (unsubscribed) {
          toast.success('Notificações desativadas');
        } else {
          toast.error('Erro ao desativar notificações');
        }
      }
    } catch (error) {
      console.error('Erro ao gerenciar notificações:', error);
      toast.error('Erro ao gerenciar notificações');
    } finally {
      setLoading(false);
    }
  };

  if (!canSubscribe) {
    return null;
  }

  if (variant === 'icon') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggleNotifications}
        disabled={loading}
        className={`p-2 rounded-lg transition-colors ${
          isSubscribed 
            ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
        } ${className}`}
        title={isSubscribed ? 'Desativar notificações' : 'Ativar notificações'}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleToggleNotifications}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
        isSubscribed
          ? 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
          : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      <span>
        {loading 
          ? 'Processando...' 
          : isSubscribed 
            ? 'Notificações Ativas' 
            : 'Ativar Notificações'
        }
      </span>
    </motion.button>
  );
};

export default NotificationButton;