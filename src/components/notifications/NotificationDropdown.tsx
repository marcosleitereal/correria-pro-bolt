import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, MessageSquare, Calendar, User, Clock } from 'lucide-react';
import { Notification } from '../../types/database';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead
}) => {
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
        return 'text-blue-600';
      case 'TRAINING_COMPLETED':
        return 'text-green-600';
      case 'NEW_RUNNER':
        return 'text-purple-600';
      default:
        return 'text-slate-600';
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

  const recentNotifications = notifications.slice(0, 10);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-96 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Notificações</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                Marcar todas como lidas
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto">
          {recentNotifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-medium text-slate-900 mb-1">Nenhuma notificação</h4>
              <p className="text-sm text-slate-600">
                Suas notificações aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => onNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-slate-100 ${iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-relaxed ${
                          !notification.is_read ? 'font-medium text-slate-900' : 'text-slate-700'
                        }`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatNotificationTime(notification.created_at)}</span>
                          </div>
                          
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(notification.id);
                              }}
                              className="text-blue-600 hover:text-blue-700 transition-colors"
                              title="Marcar como lida"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {recentNotifications.length > 0 && (
          <div className="p-3 border-t border-slate-200 bg-slate-50">
            <button
              onClick={() => {
                onClose();
                window.location.href = '/notifications';
              }}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
            >
              Ver todas as notificações →
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationDropdown;