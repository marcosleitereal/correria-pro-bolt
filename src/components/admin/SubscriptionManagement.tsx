import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Users, 
  CreditCard, 
  Save, 
  Loader2, 
  AlertCircle,
  Crown,
  Check,
  Eye,
  Plus,
  Trash2
} from 'lucide-react';
import { useSubscriptionManagement } from '../../hooks/useSubscriptionManagement';
import { useUserManagement } from '../../hooks/useUserManagement';
import CreateUserModal from './CreateUserModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import Skeleton from '../ui/Skeleton';

const SubscriptionManagement: React.FC = () => {
  const {
    coaches,
    allPlans,
    loading,
    error,
    assigning,
    assignPlan,
    getStatusLabel,
    getStatusColor,
    formatPrice,
    getPublicPlans,
    getAdminOnlyPlans
  } = useSubscriptionManagement();

  const {
    createUser,
    deleteUser,
    creating,
    deleting
  } = useUserManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlans, setSelectedPlans] = useState<Record<string, string>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
  }>({
    isOpen: false,
    userId: '',
    userName: ''
  });

  const filteredCoaches = coaches.filter(coach =>
    (coach.full_name && coach.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (coach.email && coach.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handlePlanSelect = (userId: string, planId: string) => {
    setSelectedPlans(prev => ({
      ...prev,
      [userId]: planId
    }));
  };

  const handleAssignPlan = async (userId: string) => {
    const planId = selectedPlans[userId];
    if (!planId) {
      return;
    }

    const success = await assignPlan(userId, planId);
    if (success) {
      // Limpar seleção após sucesso
      setSelectedPlans(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };

  const handleCreateUser = async (userData: { full_name: string; email: string; password: string }) => {
    const success = await createUser(userData);
    if (success) {
      setIsCreateModalOpen(false);
    }
    return success;
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    setDeleteConfirmation({
      isOpen: true,
      userId,
      userName
    });
  };

  const confirmDeleteUser = async () => {
    await deleteUser(deleteConfirmation.userId);
    setDeleteConfirmation({
      isOpen: false,
      userId: '',
      userName: ''
    });
  };

  const getPlanName = (planId: string): string => {
    const plan = allPlans.find(p => p.id === planId);
    return plan?.name || 'Plano não encontrado';
  };

  const hasChanges = (userId: string): boolean => {
    const coach = coaches.find(c => c.user_id === userId);
    const selectedPlanId = selectedPlans[userId];
    return selectedPlanId && selectedPlanId !== coach?.plan_id;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-4">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 w-full overflow-x-hidden">
      {/* Header */}
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <Users className="w-6 h-6 text-purple-600" />
          Gerenciamento de Assinaturas de Treinadores
        </h2>
        <p className="text-sm sm:text-base text-slate-600">
          Visualize e gerencie as assinaturas de todos os treinadores da plataforma
        </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Cadastrar Novo Treinador
          </motion.button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Erro ao carregar dados</p>
            <p className="text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-slate-100 w-full"
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          />
        </div>
      </motion.div>

      {/* Coaches Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden w-full"
      >
        {filteredCoaches.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchTerm ? 'Nenhum treinador encontrado' : 'Nenhum treinador cadastrado'}
            </h3>
            <p className="text-slate-600">
              {searchTerm 
                ? 'Tente ajustar os termos de busca.'
                : 'Ainda não há treinadores cadastrados na plataforma.'
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
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Nome do Treinador</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Email</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Plano Atual</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCoaches.map((coach, index) => (
                    <motion.tr
                      key={coach.user_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-slate-900">
                            {coach.full_name || 'Nome não informado'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-slate-700">{coach.email}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-slate-900">
                            {coach.current_plan_name || 'Nenhum plano'}
                          </p>
                          {coach.trial_ends_at && (
                            <p className="text-xs text-slate-500">
                              Trial até: {new Date(coach.trial_ends_at).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(coach.subscription_status)}`}>
                          {getStatusLabel(coach.subscription_status)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedPlans[coach.user_id] || coach.plan_id || ''}
                            onChange={(e) => handlePlanSelect(coach.user_id, e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-xs"
                          >
                            <option value="">Selecionar plano</option>
                            
                            {/* Planos Públicos */}
                            <optgroup label="Planos Públicos">
                              {getPublicPlans().map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                  {plan.name} - {formatPrice(plan.price_monthly)}/mês
                                </option>
                              ))}
                            </optgroup>
                            
                            {/* Planos Administrativos */}
                            {getAdminOnlyPlans().length > 0 && (
                              <optgroup label="Planos Especiais (Admin) - Gratuitos">
                                {getAdminOnlyPlans().map((plan) => (
                                  <option key={plan.id} value={plan.id}>
                                    👑 {plan.name} - GRATUITO
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                          
                          {hasChanges(coach.user_id) && (
                            <button
                              onClick={() => handleAssignPlan(coach.user_id)}
                              disabled={assigning[coach.user_id]}
                              className="bg-purple-500 text-white px-3 py-1 rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs"
                            >
                              {assigning[coach.user_id] && <Loader2 className="w-3 h-3 animate-spin" />}
                              <Save className="w-3 h-3" />
                              Atribuir
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteUser(coach.user_id, coach.full_name || 'Usuário')}
                            disabled={deleting[coach.user_id]}
                            className="bg-red-500 text-white px-3 py-1 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs"
                            title="Excluir treinador"
                          >
                            {deleting[coach.user_id] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-slate-200">
              {filteredCoaches.map((coach, index) => (
                <motion.div
                  key={coach.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-4 space-y-4"
                >
                  {/* Coach Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-slate-900">
                        {coach.full_name || 'Nome não informado'}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">{coach.email}</p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(coach.subscription_status)}`}>
                      {getStatusLabel(coach.subscription_status)}
                    </span>
                  </div>

                  {/* Current Plan */}
                  <div>
                    <p className="text-sm text-slate-500">Plano Atual:</p>
                    <p className="font-medium text-slate-900">
                      {coach.current_plan_name || 'Nenhum plano'}
                    </p>
                    {coach.trial_ends_at && (
                      <p className="text-xs text-slate-500">
                        Trial até: {new Date(coach.trial_ends_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>

                  {/* Plan Assignment */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Atribuir Novo Plano:
                    </label>
                    <select
                      value={selectedPlans[coach.user_id] || coach.plan_id || ''}
                      onChange={(e) => handlePlanSelect(coach.user_id, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                    >
                      <option value="">Selecionar plano</option>
                      
                      {/* Planos Públicos */}
                      <optgroup label="Planos Públicos">
                        {getPublicPlans().map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} - {formatPrice(plan.price_monthly)}/mês
                          </option>
                        ))}
                      </optgroup>
                      
                      {/* Planos Administrativos */}
                      {getAdminOnlyPlans().length > 0 && (
                        <optgroup label="Planos Especiais (Admin) - Gratuitos">
                          {getAdminOnlyPlans().map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              👑 {plan.name} - GRATUITO
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    
                    {hasChanges(coach.user_id) && (
                      <button
                        onClick={() => handleAssignPlan(coach.user_id)}
                        disabled={assigning[coach.user_id]}
                        className="w-full bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                      >
                        {assigning[coach.user_id] && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Save className="w-4 h-4" />
                        Atribuir Plano
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteUser(coach.user_id, coach.full_name || 'Usuário')}
                      disabled={deleting[coach.user_id]}
                      className="w-full bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2"
                    >
                      {deleting[coach.user_id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Excluir Treinador
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateUser}
        loading={creating}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, userId: '', userName: '' })}
        onConfirm={confirmDeleteUser}
        title="Excluir Treinador"
        message={`Tem certeza que deseja excluir o treinador "${deleteConfirmation.userName}"? Esta ação não pode ser desfeita e todos os dados do treinador serão perdidos permanentemente.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        loading={deleting[deleteConfirmation.userId]}
      />

      {/* Plans Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 w-full"
      >
        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-600" />
          Tipos de Planos Disponíveis
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-slate-700">
              <strong>Planos Públicos:</strong> Visíveis na página de preços
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-600" />
            <span className="text-slate-700">
              <strong>Planos Especiais:</strong> Apenas para administradores
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionManagement;