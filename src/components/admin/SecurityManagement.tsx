import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  FileText, 
  Users, 
  Search, 
  Filter, 
  Calendar,
  Eye,
  UserCheck,
  AlertTriangle,
  Loader2,
  Save
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { useUserManagement } from '../../hooks/useUserManagement';
import Skeleton from '../ui/Skeleton';

const SecurityManagement: React.FC = () => {
  const { 
    logs, 
    loading: logsLoading, 
    error: logsError, 
    fetchLogs,
    getActionLabel,
    getUniqueActions,
    getUniqueActors
  } = useAuditLogs();

  const {
    users,
    loading: usersLoading,
    error: usersError,
    updateUserRole,
    getRoleLabel,
    getRoleColor
  } = useUserManagement();

  // Filtros para logs de auditoria
  const [logFilters, setLogFilters] = useState({
    actor_email: '',
    action: '',
    start_date: null as Date | null,
    end_date: null as Date | null
  });

  // Estados para gerenciamento de usuários
  const [updatingUsers, setUpdatingUsers] = useState<Record<string, boolean>>({});

  const handleLogFilterChange = (field: string, value: any) => {
    const newFilters = { ...logFilters, [field]: value };
    setLogFilters(newFilters);
    fetchLogs(newFilters);
  };

  const clearLogFilters = () => {
    const emptyFilters = {
      actor_email: '',
      action: '',
      start_date: null,
      end_date: null
    };
    setLogFilters(emptyFilters);
    fetchLogs();
  };

  const handleRoleUpdate = async (userId: string, newRole: 'coach' | 'admin') => {
    setUpdatingUsers(prev => ({ ...prev, [userId]: true }));
    
    try {
      await updateUserRole(userId, newRole);
    } finally {
      setUpdatingUsers(prev => ({ ...prev, [userId]: false }));
    }
  };

  const formatLogDetails = (details: any) => {
    if (!details || typeof details !== 'object') {
      return 'Sem detalhes';
    }

    // Formatação específica por tipo de ação
    if (details.target_user_email && details.old_role && details.new_role) {
      return `Usuário: ${details.target_user_email} | ${details.old_role} → ${details.new_role}`;
    }

    if (details.runner_name) {
      return `Corredor: ${details.runner_name}`;
    }

    if (details.training_title) {
      return `Treino: ${details.training_title}`;
    }

    // Fallback para outros detalhes
    return Object.entries(details)
      .slice(0, 3) // Limitar a 3 campos
      .map(([key, value]) => `${key}: ${value}`)
      .join(' | ');
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full overflow-x-hidden">
      {/* Logs de Auditoria */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden w-full"
      >
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold">Logs de Auditoria</h3>
              <p className="text-blue-100 text-sm sm:text-base">
                Histórico completo de ações realizadas na plataforma
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-4 sm:p-6 border-b border-slate-200 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email do Usuário
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por email..."
                  value={logFilters.actor_email}
                  onChange={(e) => handleLogFilterChange('actor_email', e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Filtro por Ação */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Ação
              </label>
              <select
                value={logFilters.action}
                onChange={(e) => handleLogFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              >
                <option value="">Todas as ações</option>
                {getUniqueActions().map((action) => (
                  <option key={action} value={action}>
                    {getActionLabel(action)}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Inicial */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data Inicial
              </label>
              <DatePicker
                selected={logFilters.start_date}
                onChange={(date) => handleLogFilterChange('start_date', date)}
                placeholderText="Selecionar data"
                dateFormat="dd/MM/yyyy"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              />
            </div>

            {/* Data Final */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data Final
              </label>
              <DatePicker
                selected={logFilters.end_date}
                onChange={(date) => handleLogFilterChange('end_date', date)}
                placeholderText="Selecionar data"
                dateFormat="dd/MM/yyyy"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Limpar Filtros */}
          {(logFilters.actor_email || logFilters.action || logFilters.start_date || logFilters.end_date) && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <button
                onClick={clearLogFilters}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>

        {/* Tabela de Logs */}
        <div className="w-full">
          {logsError && (
            <div className="p-6 bg-red-50 border-b border-red-200 text-red-700 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Erro ao carregar logs</p>
                <p className="text-sm">{logsError}</p>
              </div>
            </div>
          )}

          {logsLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Nenhum log encontrado
              </h3>
              <p className="text-slate-600">
                {Object.values(logFilters).some(Boolean) 
                  ? "Não há logs que correspondam aos filtros aplicados."
                  : "Ainda não há logs de auditoria registrados."
                }
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-slate-900">Data</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-900">Ator (Usuário)</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-900">Ação</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-900">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {logs.map((log, index) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-4 px-6 text-sm text-slate-700">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {log.actor_email || 'Sistema'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-700 max-w-xs truncate">
                          {formatLogDetails(log.details)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-slate-200">
                {logs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {getActionLabel(log.action)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {log.actor_email || 'Sistema'}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        {formatLogDetails(log.details)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Gerenciamento de Funções de Usuário */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden w-full"
      >
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6" />
            <div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold">Gerenciamento de Funções de Usuário</h3>
              <p className="text-purple-100 text-sm sm:text-base">
                Gerencie as permissões e funções dos usuários da plataforma
              </p>
            </div>
          </div>
        </div>

        <div className="w-full">
          {usersError && (
            <div className="p-6 bg-red-50 border-b border-red-200 text-red-700 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Erro ao carregar usuários</p>
                <p className="text-sm">{usersError}</p>
              </div>
            </div>
          )}

          {usersLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Nenhum usuário encontrado
              </h3>
              <p className="text-slate-600">
                Não há usuários cadastrados na plataforma.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-slate-900">Nome</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-900">Email do Usuário</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-900">Função Atual</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-900">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <p className="text-sm font-medium text-slate-900">
                            {user.full_name || 'Nome não informado'}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm text-slate-700">
                            {user.email}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleUpdate(user.id, e.target.value as 'coach' | 'admin')}
                              disabled={updatingUsers[user.id]}
                              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm disabled:opacity-50"
                            >
                              <option value="coach">Treinador</option>
                              <option value="admin">Administrador</option>
                            </select>
                            {updatingUsers[user.id] && (
                              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-slate-200">
                {users.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-slate-900">
                          {user.full_name || 'Nome não informado'}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {user.email}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-slate-700">
                        Nova Função:
                      </label>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleUpdate(user.id, e.target.value as 'coach' | 'admin')}
                        disabled={updatingUsers[user.id]}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm disabled:opacity-50"
                      >
                        <option value="coach">Treinador</option>
                        <option value="admin">Administrador</option>
                      </select>
                      {updatingUsers[user.id] && (
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SecurityManagement;