import { useState, useEffect } from 'react';
import { MessageSquare, Calendar, User, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { Notification } from '../types/database';
import { toast } from 'sonner';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    fetchNotifications();
    fetchUnreadCount();
    
    // Configurar real-time subscription
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📢 Nova notificação recebida:', payload.new);
          const newNotification = payload.new as Notification;
          
          // Adicionar à lista
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Mostrar toast
          toast.info(newNotification.message, {
            duration: 5000,
            action: {
              label: 'Ver',
              onClick: () => handleNotificationClick(newNotification)
            }
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        throw fetchError;
      }

      setNotifications(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar notificações:', err);
      setError(err.message || 'Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      setUnreadCount(count || 0);
    } catch (err: any) {
      console.error('Erro ao carregar contador de notificações:', err);
    }
  };

  const markAsRead = async (notificationId: string): Promise<boolean> => {
    try {
      // Verificar conectividade básica primeiro
      if (!navigator.onLine) {
        console.warn('⚠️ Usuário está offline, não é possível marcar notificação como lida');
        toast.error('Você está offline. Conecte-se à internet para marcar notificações como lidas.');
        return false;
      }

      // Verificar se o Supabase está configurado
      if (!supabase || typeof supabase.from !== 'function') {
        console.error('❌ Supabase não está configurado corretamente');
        toast.error('Erro de configuração do sistema');
        return false;
      }

      // Verificar se o usuário está autenticado
      if (!user?.id) {
        console.error('❌ Usuário não autenticado para marcar notificação como lida');
        toast.error('Usuário não autenticado');
        return false;
      }

      console.log('🔄 Tentando marcar notificação como lida:', {
        notificationId,
        userId: user.id,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.substring(0, 30) + '...'
      });

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('recipient_id', user?.id);

      if (error) {
        console.error('❌ Erro específico do Supabase:', error);
        throw error;
      }

      console.log('✅ Notificação marcada como lida com sucesso');

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
      
      // Decrementar contador
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (err: any) {
      console.error('Erro ao marcar notificação como lida:', err);
      
      // Tratamento específico para diferentes tipos de erro
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('NetworkError') ||
        err.message.includes('fetch') ||
        err.name === 'TypeError'
      )) {
        console.warn('⚠️ Erro de conectividade detectado ao marcar notificação como lida');
        toast.error('Erro de conexão. Verifique sua internet e tente novamente.');
      } else if (err.code === 'PGRST301') {
        console.warn('⚠️ Erro de RLS - usuário sem permissão');
        toast.error('Sem permissão para marcar esta notificação como lida');
      } else if (err.code && err.code.startsWith('PGRST')) {
        console.warn('⚠️ Erro do PostgREST:', err.code);
        toast.error('Erro no servidor. Tente novamente em alguns segundos.');
      } else if (err.message && err.message.includes('Supabase não está configurado')) {
        console.warn('⚠️ Erro de configuração detectado ao marcar notificação como lida');
        toast.error('Erro de configuração do sistema');
      } else {
        toast.error('Erro inesperado. Tente recarregar a página.');
      }
      
      return false;
    }
  };

  const markAllAsRead = async (): Promise<boolean> => {
    try {
      // Verificar conectividade básica primeiro
      if (!navigator.onLine) {
        console.warn('⚠️ Usuário está offline, não é possível marcar notificações como lidas');
        toast.error('Você está offline. Conecte-se à internet para marcar notificações como lidas.');
        return false;
      }

      // Verificar se o Supabase está configurado
      if (!supabase || typeof supabase.from !== 'function') {
        console.error('❌ Supabase não está configurado corretamente');
        toast.error('Erro de configuração do sistema');
        return false;
      }

      // Verificar se o usuário está autenticado
      if (!user?.id) {
        console.error('❌ Usuário não autenticado para marcar notificações como lidas');
        toast.error('Usuário não autenticado');
        return false;
      }

      console.log('🔄 Tentando marcar todas as notificações como lidas para usuário:', user.id);

      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', user?.id)
        .eq('is_read', false)
        .select('id');

      if (error) {
        console.error('❌ Erro específico do Supabase ao marcar todas como lidas:', error);
        throw error;
      }

      console.log('✅ Todas as notificações marcadas como lidas:', data?.length || 0);

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      
      setUnreadCount(0);
      
      toast.success(`${data?.length || 0} notificações marcadas como lidas`);
      return true;
    } catch (err: any) {
      console.error('❌ Erro completo ao marcar todas as notificações como lidas:', {
        error: err,
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
      
      // Tratamento específico para erro de conectividade
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('NetworkError') ||
        err.message.includes('fetch') ||
        err.name === 'TypeError'
      )) {
        console.warn('⚠️ Erro de conectividade detectado ao marcar todas as notificações como lidas');
        toast.error('Erro de conexão. Verifique sua internet e tente novamente.');
      } else if (err.code === 'PGRST301') {
        console.warn('⚠️ Erro de RLS - usuário sem permissão');
        toast.error('Sem permissão para marcar notificações como lidas');
      } else if (err.code && err.code.startsWith('PGRST')) {
        console.warn('⚠️ Erro do PostgREST:', err.code);
        toast.error('Erro no servidor. Tente novamente em alguns segundos.');
      } else {
        toast.error('Erro inesperado. Tente recarregar a página.');
      }
      
      return false;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    console.log('🔍 Clique na notificação:', {
      id: notification.id,
      type: notification.type,
      related_entity_id: notification.related_entity_id,
      details: notification.details,
      details: notification.details,
      message: notification.message
    });

    // Marcar como lida se não estiver
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navegar baseado no tipo
    switch (notification.type) {
      case 'NEW_FEEDBACK':
        // NOVA LÓGICA: Navegação inteligente para treino específico
        if (notification.details && typeof notification.details === 'object') {
          const details = notification.details as any;
          const runnerId = details.runnerId || details.runner_id;
          const trainingId = details.trainingId || details.training_id;
          
          if (runnerId && trainingId) {
            // Navegar para o treino específico com âncora
            const specificTrainingUrl = `/runners/${runnerId}/history#training-${trainingId}`;
            console.log('📍 Navegando para treino específico:', {
              runner_id: runnerId,
              training_id: trainingId,
              url: specificTrainingUrl
            });
            
            window.location.href = specificTrainingUrl;
          } else if (runnerId) {
            // Fallback: navegar apenas para o histórico do corredor
            const runnerHistoryUrl = `/runners/${runnerId}/history`;
            console.log('📍 Fallback - Navegando para histórico do corredor:', {
              runner_id: runnerId,
              url: runnerHistoryUrl
            });
            
            window.location.href = runnerHistoryUrl;
          } else {
            console.error('❌ Dados insuficientes na notificação NEW_FEEDBACK:', notification);
          }
        } else if (notification.related_entity_id) {
          // Fallback para notificações antigas sem details
          const runnerHistoryUrl = `/runners/${notification.related_entity_id}/history`;
          console.log('📍 Fallback legacy - Navegando para histórico do corredor:', {
            runner_id: notification.related_entity_id,
            url: runnerHistoryUrl
          });
          
          window.location.href = runnerHistoryUrl;
        } else {
          console.error('❌ related_entity_id não encontrado na notificação NEW_FEEDBACK');
        }
        // NOVA LÓGICA: Navegação inteligente para treino específico
        if (notification.details && typeof notification.details === 'object') {
          const details = notification.details as any;
          const runnerId = details.runnerId || details.runner_id;
          const trainingId = details.trainingId || details.training_id;
          
          if (runnerId && trainingId) {
            // Navegar para o treino específico com âncora
            const specificTrainingUrl = `/runners/${runnerId}/history#training-${trainingId}`;
            console.log('📍 Navegando para treino específico:', {
              runner_id: runnerId,
              training_id: trainingId,
              url: specificTrainingUrl
            });
            
            window.location.href = specificTrainingUrl;
          } else if (runnerId) {
            // Fallback: navegar apenas para o histórico do corredor
            const runnerHistoryUrl = `/runners/${runnerId}/history`;
            console.log('📍 Fallback - Navegando para histórico do corredor:', {
              runner_id: runnerId,
              url: runnerHistoryUrl
            });
            
            window.location.href = runnerHistoryUrl;
          } else {
            console.error('❌ Dados insuficientes na notificação NEW_FEEDBACK:', notification);
          }
        } else if (notification.related_entity_id) {
          // Fallback para notificações antigas sem details
          const runnerHistoryUrl = `/runners/${notification.related_entity_id}/history`;
          console.log('📍 Fallback legacy - Navegando para histórico do corredor:', {
            runner_id: notification.related_entity_id,
            url: runnerHistoryUrl
          });
          
          window.location.href = runnerHistoryUrl;
        } else {
          console.error('❌ related_entity_id não encontrado na notificação NEW_FEEDBACK');
        }
        break;
      case 'TRAINING_COMPLETED':
        if (notification.related_entity_id) {
          console.log('📍 Navegando para treino concluído:', notification.related_entity_id);
          window.location.href = `/dashboard/training/${notification.related_entity_id}/edit`;
        }
        break;
      case 'NEW_RUNNER':
        if (notification.related_entity_id) {
          console.log('📍 Navegando para novo corredor:', notification.related_entity_id);
          window.location.href = `/runners/${notification.related_entity_id}/history`;
        }
        break;
      default:
        console.warn('⚠️ Tipo de notificação não reconhecido:', {
          type: notification.type,
          notification: notification
        });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_FEEDBACK':
        return MessageSquare;
      case 'TRAINING_COMPLETED':
        return Calendar;
      case 'NEW_RUNNER':
        return User;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'NEW_FEEDBACK':
        return 'bg-blue-100 text-blue-700';
      case 'TRAINING_COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'NEW_RUNNER':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const formatNotificationTime = (createdAt: string): string => {
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Agora mesmo';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m atrás`;
    } else if (diffInMinutes < 1440) { // 24 horas
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h atrás`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d atrás`;
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    handleNotificationClick,
    getNotificationIcon,
    getNotificationColor,
    formatNotificationTime,
    refetch: fetchNotifications,
  };
};