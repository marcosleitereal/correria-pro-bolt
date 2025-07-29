import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationButtonProps {
  variant?: 'icon' | 'button';
  className?: string;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({
  variant = 'icon',
  className = ''
}) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOneSignalReady, setIsOneSignalReady] = useState(false);

  useEffect(() => {
    // Verificar se OneSignal está disponível
    const checkOneSignal = () => {
      if (window.OneSignal) {
        setIsOneSignalReady(true);
        
        // Verificar status de inscrição
        window.OneSignal.isPushNotificationsEnabled().then((enabled: boolean) => {
          setIsSubscribed(enabled);
        });
      } else {
        // Tentar novamente em 1 segundo
        setTimeout(checkOneSignal, 1000);
      }
    };

    checkOneSignal();
  }, []);

  const handleToggleNotifications = async () => {
    if (!isOneSignalReady) {
      toast.error('Sistema de notificações não está pronto');
      return;
    }

    setLoading(true);

    try {
      if (!isSubscribed) {
        // Solicitar permissão e inscrever
        const permission = await window.OneSignal.getNotificationPermission();
        
        if (permission === 'default') {
          await window.OneSignal.showSlidedownPrompt();
        }

        await window.OneSignal.registerForPushNotifications();
        const enabled = await window.OneSignal.isPushNotificationsEnabled();
        
        if (enabled) {
          setIsSubscribed(true);
          toast.success('Notificações ativadas com sucesso!');
          
          // Enviar tags do usuário
          const userEmail = localStorage.getItem('user_email');
          const userRole = localStorage.getItem('user_role');
          
          if (userEmail) {
            window.OneSignal.sendTag('email', userEmail);
          }
          
          if (userRole) {
            window.OneSignal.sendTag('role', userRole);
          }
        } else {
          toast.error('Erro ao ativar notificações');
        }
      } else {
        // Desinscrever
        await window.OneSignal.setSubscription(false);
        setIsSubscribed(false);
        toast.success('Notificações desativadas');
      }
    } catch (error) {
      console.error('Erro ao gerenciar notificações:', error);
      toast.error('Erro ao gerenciar notificações');
    } finally {
      setLoading(false);
    }
  };

  if (!isOneSignalReady) {
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

// Declarar tipos globais para OneSignal
declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: any[];
  }
}

export default NotificationButton;