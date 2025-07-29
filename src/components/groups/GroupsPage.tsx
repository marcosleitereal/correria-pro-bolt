import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Users, Edit, Trash2, UserPlus } from 'lucide-react';
import { useTrainingGroups } from '../../hooks/useTrainingGroups';
import { useGroupMemberships } from '../../hooks/useGroupMemberships';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import EmptyState from '../ui/EmptyState';
import GroupModal from './GroupModal';
import MemberManagementModal from './MemberManagementModal';
import { TrainingGroup } from '../../types/database';
import Skeleton from '../ui/Skeleton';
import SubscriptionGuard from '../ui/SubscriptionGuard';

const GroupsPage: React.FC = () => {
  const { groups, loading, error, createGroup, updateGroup, deleteGroup } = useTrainingGroups();
  const { getMemberCount } = useGroupMemberships();
  const { canAccessFeature, blockingReason, loading: guardLoading } = useSubscriptionGuard();
  const [searchTerm, setSearchTerm] = useState('');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TrainingGroup | null>(null);
  const [managingGroup, setManagingGroup] = useState<TrainingGroup | null>(null);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateGroup = async (groupData: Partial<TrainingGroup>) => {
    const success = await createGroup(groupData);
    if (success) {
      setIsGroupModalOpen(false);
    }
  };

  const handleUpdateGroup = async (groupData: Partial<TrainingGroup>) => {
    if (!editingGroup) return;
    
    const success = await updateGroup(editingGroup.id, groupData);
    if (success) {
      setIsGroupModalOpen(false);
      setEditingGroup(null);
    }
  };

  const handleEditGroup = (group: TrainingGroup) => {
    setEditingGroup(group);
    setIsGroupModalOpen(true);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este grupo? Esta ação não pode ser desfeita.')) {
      const success = await deleteGroup(groupId);
      if (success) {
        setIsGroupModalOpen(false);
        setEditingGroup(null);
      }
    }
  };

  const handleManageMembers = (group: TrainingGroup) => {
    setManagingGroup(group);
    setIsMemberModalOpen(true);
  };

  const getLevelLabel = (level: string | null) => {
    if (!level) return '';
    const labels = {
      iniciante: 'Iniciante',
      intermediario: 'Intermediário',
      avancado: 'Avançado'
    };
    return labels[level as keyof typeof labels] || level;
  };

  const getLevelColor = (level: string | null) => {
    if (!level) return 'bg-slate-100 text-slate-700';
    const colors = {
      iniciante: 'bg-green-100 text-green-700',
      intermediario: 'bg-blue-100 text-blue-700',
      avancado: 'bg-purple-100 text-purple-700'
    };
    return colors[level as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  // VERIFICAÇÃO DE LOADING (dados dos grupos + guard)
  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div>
          <Skeleton className="h-8 w-1/4 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // BLOQUEIO TOTAL PARA PLANO RESTRITO OU SEM ACESSO
  if (!canAccessFeature) {
    return (
      <div className="p-6 lg:p-8">
        <SubscriptionGuard feature="general">
          <div></div>
        </SubscriptionGuard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div>
          <Skeleton className="h-8 w-1/4 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
      >
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Meus Grupos de Treino
          </h1>
          <p className="text-lg text-slate-600">
            Organize seus corredores em grupos para treinos mais eficientes
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingGroup(null);
            setIsGroupModalOpen(true);
          }}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Criar Novo Grupo
        </motion.button>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-8"
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar grupos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8"
        >
          Erro ao carregar grupos: {error}
        </motion.div>
      )}

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <EmptyState
            icon={Users}
            title="Nenhum grupo encontrado"
            description={searchTerm 
              ? "Não encontramos grupos com esse termo de busca. Tente buscar por outro nome."
              : "Você ainda não criou nenhum grupo de treino. Organize seus corredores em grupos para facilitar o gerenciamento."
            }
            actionText="+ Criar Primeiro Grupo"
            onAction={() => {
              setEditingGroup(null);
              setIsGroupModalOpen(true);
            }}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredGroups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100"
            >
              {/* Group Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {group.name}
                  </h3>
                  {group.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Level Badge */}
              {group.level && (
                <div className="mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(group.level)}`}>
                    {getLevelLabel(group.level)}
                  </span>
                </div>
              )}

              {/* Member Count */}
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">
                  {getMemberCount(group.id)} {getMemberCount(group.id) === 1 ? 'Membro' : 'Membros'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleManageMembers(group)}
                  className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Gerenciar Membros
                </button>
                <button
                  onClick={() => handleEditGroup(group)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar grupo"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>

              {/* Status Indicator */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    group.status === 'ativo' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {group.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </span>
                  <p className="text-xs text-slate-500">
                    Criado em {new Date(group.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Group Modal */}
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => {
          setIsGroupModalOpen(false);
          setEditingGroup(null);
        }}
        onSave={editingGroup ? handleUpdateGroup : handleCreateGroup}
        onDelete={editingGroup ? () => handleDeleteGroup(editingGroup.id) : undefined}
        group={editingGroup}
        loading={loading}
      />

      {/* Member Management Modal */}
      <MemberManagementModal
        isOpen={isMemberModalOpen}
        onClose={() => {
          setIsMemberModalOpen(false);
          setManagingGroup(null);
        }}
        group={managingGroup}
      />
    </div>
  );
};

export default GroupsPage;