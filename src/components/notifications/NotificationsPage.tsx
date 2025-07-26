import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  MessageSquare, 
  Calendar, 
  User, 
  Clock,
  Filter,
  Search,
  AlertCircle
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import Skeleton from '../ui/Skeleton';

const NotificationsPage: React.FC = () => {
  const { 
    notifications, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead,
    handleNotificationClick,
    getNotificationIcon,
    getNotificationColor,
    formatNotificationTime
  } = useNotifications();

  const [filterType, setFilterType] = useState<string>('');
  const [filterRead, setFilterRead] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar notificações
  const filteredNotifications = notifications.filter(notification => {
    const matchesType = !filterType || notification.type === filterType;
    const matchesRead = !filterRead || 
      (filterRead === 'unread' && !notification.is_read) ||
      (filterRead === 'read' && notification.is_read);
    const matchesSearch = !searchTerm || 
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesRead && matchesSearch;
  });

  // Agrupar notificações por data
  const groupNotificationsByDate = (notifications: any[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const groups: Record<string, any[]> = {
      'Hoje': [],
      'Ontem': [],
      'Esta Semana': [],
      'Mais Antigas': []
    };

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.created_at);
      const isToday = notificationDate.toDateString() === today.toDateString();
      const isYesterday = notificationDate.toDateString() === yesterday.toDateString();
      const isThisWeek = notificationDate >= thisWeek && !isToday && !isYesterday;

      if (isToday) {
        groups['Hoje'].push(notification);
      } else if (isYesterday) {
        groups['Ontem'].push(notification);
      } else if (isThisWeek) {
        groups['Esta Semana'].push(notification);
      } else {
        groups['Mais Antigas'].push(notification);
      }
    });

    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(filteredNotifications);
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const uniqueTypes = [...new Set(notifications.map(n => n.type))];

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'NEW_FEEDBACK': 'Novo Feedback',
      'TRAINING_COMPLETED': 'Treino Concluído',
      'NEW_RUNNER': 'Novo Corredor'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-1/3 mb-6" />
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-lg">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho da Página */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
              Todas as Notificações
            </h1>
            <p className="text-lg text-slate-600">
              Gerencie todas as suas notificações em um só lugar
            </p>
          </div>
          
          {unreadCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={markAllAsRead}
              className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <CheckCheck className="w-5 h-5" />
              Marcar Todas como Lidas ({unreadCount})
            </motion.button>
          )}
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-lg mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Buscar Notificação
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por mensagem..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Filtro por Tipo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Notificação
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Todos os tipos</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {getTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status de Leitura
              </label>
              <select
                value={filterRead}
                onChange={(e) => setFilterRead(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Todas</option>
                <option value="unread">Não lidas</option>
                <option value="read">Lidas</option>
              </select>
            </div>
          </div>

          {/* Limpar Filtros */}
          {(filterType || filterRead || searchTerm) && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setFilterType('');
                  setFilterRead('');
                  setSearchTerm('');
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </motion.div>

        {/* Estado de Erro */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Erro ao carregar notificações</p>
              <p className="text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Lista de Notificações Agrupadas */}
        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-500" />
            </div>
            
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchTerm || filterType || filterRead ? 'Nenhuma notificação encontrada' : 'Nenhuma notificação'}
            </h3>
            
            <p className="text-slate-600">
              {searchTerm || filterType || filterRead 
                ? 'Tente ajustar os filtros para encontrar notificações.'
                : 'Suas notificações aparecerão aqui quando você recebê-las.'
              }
            </p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedNotifications).map(([groupName, groupNotifications]) => {
              if (groupNotifications.length === 0) return null;

              return (
                <motion.div
                  key={groupName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-4"
                >
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-500" />
                    {groupName}
                    <span className="text-sm font-normal text-slate-500">
                      ({groupNotifications.length})
                    </span>
                  </h2>

                  <div className="space-y-3">
                    {groupNotifications.map((notification, index) => {
                      const Icon = getNotificationIcon(notification.type);
                      const iconColor = getNotificationColor(notification.type);
                      
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 ${
                            !notification.is_read 
                              ? 'border-l-blue-500 bg-blue-50' 
                              : 'border-l-slate-200'
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${iconColor.replace('text-', 'bg-').replace('-600', '-100')}`}>
                              <Icon className={`w-5 h-5 ${iconColor}`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className={`leading-relaxed ${
                                !notification.is_read 
                                  ? 'font-medium text-slate-900' 
                                  : 'text-slate-700'
                              }`}>
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatNotificationTime(notification.created_at)}</span>
                                  <span>•</span>
                                  <span>{getTypeLabel(notification.type)}</span>
                                </div>
                                
                                {!notification.is_read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                    className="text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 text-xs font-medium"
                                    title="Marcar como lida"
                                  >
                                    <Check className="w-3 h-3" />
                                    Marcar como lida
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Estatísticas */}
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 bg-slate-50 rounded-xl p-6"
          >
            <h3 className="font-semibold text-slate-900 mb-4">Estatísticas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-2xl font-bold text-slate-900">{notifications.length}</p>
                <p className="text-slate-600">Total de Notificações</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
                <p className="text-slate-600">Não Lidas</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-2xl font-bold text-green-600">{notifications.length - unreadCount}</p>
                <p className="text-slate-600">Lidas</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;