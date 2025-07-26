import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Users, Archive, Edit, Calendar, MapPin, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRunners } from '../../hooks/useRunners';
import { useNotifications } from '../../hooks/useNotifications';
import EmptyState from '../ui/EmptyState';
import RunnerModal from './RunnerModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import SubscriptionGuard from '../ui/SubscriptionGuard';
import { Runner } from '../../types/database';
import Skeleton from '../ui/Skeleton';

const RunnersPage: React.FC = () => {
  const navigate = useNavigate();
  const { runners, loading, error, createRunner, updateRunner, archiveRunner, unarchiveRunner } = useRunners();
  const { notifications } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRunner, setEditingRunner] = useState<Runner | null>(null);
  const [archiveConfirmation, setArchiveConfirmation] = useState<{
    isOpen: boolean;
    runnerId: string;
    runnerName: string;
  }>({
    isOpen: false,
    runnerId: '',
    runnerName: ''
  });

  const [unarchiveConfirmation, setUnarchiveConfirmation] = useState<{
    isOpen: boolean;
    runnerId: string;
    runnerName: string;
  }>({
    isOpen: false,
    runnerId: '',
    runnerName: ''
  });

  // Filtrar corredores baseado no modo de visualização
  const displayedRunners = runners.filter(runner => {
    const matchesView = viewMode === 'active' ? !runner.is_archived : runner.is_archived;
    const matchesSearch = runner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (runner.main_goal && runner.main_goal.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesView && matchesSearch;
  });

  const activeRunnersCount = runners.filter(r => !r.is_archived).length;
  const archivedRunnersCount = runners.filter(r => r.is_archived).length;

  const handleUnarchiveRunner = (runnerId: string, runnerName: string) => {
    setUnarchiveConfirmation({
      isOpen: true,
      runnerId,
      runnerName
    });
  };

  const confirmUnarchiveRunner = async () => {
    await unarchiveRunner(unarchiveConfirmation.runnerId);
    setUnarchiveConfirmation({
      isOpen: false,
      runnerId: '',
      runnerName: ''
    });
  };

  const handleCreateRunner = async (runnerData: Partial<Runner>) => {
    const success = await createRunner(runnerData);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleUpdateRunner = async (runnerData: Partial<Runner>) => {
    if (!editingRunner) return;
    
    const success = await updateRunner(editingRunner.id, runnerData);
    if (success) {
      setIsModalOpen(false);
      setEditingRunner(null);
    }
  };

  const handleEditRunner = (runner: Runner) => {
    setEditingRunner(runner);
    setIsModalOpen(true);
  };

  const handleArchiveRunner = (runnerId: string, runnerName: string) => {
    setArchiveConfirmation({
      isOpen: true,
      runnerId,
      runnerName
    });
  };

  const confirmArchiveRunner = async () => {
    await archiveRunner(archiveConfirmation.runnerId);
    setArchiveConfirmation({
      isOpen: false,
      runnerId: '',
      runnerName: ''
    });
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getFitnessLevelLabel = (level: string) => {
    const labels = {
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado',
      professional: 'Profissional'
    };
    return labels[level as keyof typeof labels] || level;
  };

  const hasUnreadFeedback = (runnerId: string) => {
    return notifications.some(notification => 
      notification.type === 'NEW_FEEDBACK' && 
      !notification.is_read && 
      notification.related_entity_id === runnerId
    );
  };
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

  const getFitnessLevelColor = (level: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-700',
      intermediate: 'bg-blue-100 text-blue-700',
      advanced: 'bg-purple-100 text-purple-700',
      professional: 'bg-orange-100 text-orange-700'
    };
    return colors[level as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

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
            Meus Corredores
          </h1>
          <p className="text-lg text-slate-600">
            Gerencie seus atletas e acompanhe o progresso de cada um
          </p>
        </div>
        
        <SubscriptionGuard feature="create_runner">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingRunner(null);
              setIsModalOpen(true);
            }}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Adicionar Corredor
          </motion.button>
        </SubscriptionGuard>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-8 space-y-4"
      >
        {/* View Toggle */}
        <div className="flex items-center justify-center">
          <div className="bg-white rounded-xl p-2 shadow-lg border border-slate-200 flex">
            <button
              onClick={() => setViewMode('active')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                viewMode === 'active'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Eye className="w-4 h-4" />
              Ativos ({activeRunnersCount})
            </button>
            <button
              onClick={() => setViewMode('archived')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                viewMode === 'archived'
                  ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Archive className="w-4 h-4" />
              Arquivados ({archivedRunnersCount})
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder={`Buscar ${viewMode === 'active' ? 'corredores ativos' : 'corredores arquivados'}...`}
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
          Erro ao carregar corredores: {error}
        </motion.div>
      )}

      {/* Runners Grid */}
      {displayedRunners.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <EmptyState
            icon={Users}
            title={viewMode === 'active' ? "Nenhum corredor ativo encontrado" : "Nenhum corredor arquivado encontrado"}
            description={searchTerm 
              ? `Não encontramos ${viewMode === 'active' ? 'corredores ativos' : 'corredores arquivados'} com esse termo de busca. Tente buscar por outro nome.`
              : viewMode === 'active' 
                ? "Você ainda não adicionou nenhum corredor. Comece criando o perfil do seu primeiro atleta."
                : "Você não possui corredores arquivados. Corredores arquivados aparecerão aqui quando você arquivar algum atleta."
            }
            actionText={viewMode === 'active' ? "+ Adicionar Primeiro Corredor" : undefined}
            onAction={viewMode === 'active' ? () => {
              setEditingRunner(null);
              setIsModalOpen(true);
            } : undefined}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {displayedRunners.map((runner, index) => (
            <motion.div
              key={runner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100"
            >
              {/* Runner Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-slate-900">
                      {runner.name}
                    </h3>
                    {hasUnreadFeedback(runner.id) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Novo Feedback!
                      </motion.div>
                    )}
                  </div>
                  {runner.birth_date && (
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {calculateAge(runner.birth_date)} anos
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditRunner(runner)}
                    disabled={viewMode === 'archived'}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar corredor"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {viewMode === 'active' ? (
                    <button
                    onClick={() => handleArchiveRunner(runner.id, runner.name)}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Arquivar corredor"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  ) : (
                    <button
                      onClick={() => handleUnarchiveRunner(runner.id, runner.name)}
                      className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Desarquivar corredor"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Fitness Level Badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getFitnessLevelColor(runner.fitness_level)}`}>
                  {getFitnessLevelLabel(runner.fitness_level)}
                </span>
              </div>

              {/* Runner Details */}
              <div className="space-y-2 text-sm">
                {runner.main_goal && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">Meta: {runner.main_goal}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {runner.weight_kg && (
                    <div>
                      <span className="text-slate-500">Peso:</span>
                      <span className="text-slate-700 font-medium ml-1">{runner.weight_kg}kg</span>
                    </div>
                  )}
                  {runner.height_cm && (
                    <div>
                      <span className="text-slate-500">Altura:</span>
                      <span className="text-slate-700 font-medium ml-1">{runner.height_cm}cm</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                {viewMode === 'active' ? (
                  <button
                    onClick={() => navigate(`/runners/${runner.id}/history`)}
                    className={`w-full px-4 py-2 rounded-lg font-medium hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2 ${
                      hasUnreadFeedback(runner.id)
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white animate-pulse'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    {hasUnreadFeedback(runner.id) ? 'Ver Novo Feedback' : 'Ver Histórico'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnarchiveRunner(runner.id, runner.name)}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Desarquivar Corredor
                  </button>
                )}
              </div>
              {/* Last Training Info */}
              {viewMode === 'active' && (
                <div className="mt-2">
                <p className="text-xs text-slate-500">
                  Último treino: {runner.last_training_date 
                    ? new Date(runner.last_training_date).toLocaleDateString('pt-BR')
                    : 'Nenhum treino registrado'
                  }
                </p>
              </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Runner Modal */}
      <RunnerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRunner(null);
        }}
        onSave={editingRunner ? handleUpdateRunner : handleCreateRunner}
        runner={editingRunner}
        loading={loading}
      />

      {/* Archive Confirmation Modal */}
      <ConfirmationModal
        isOpen={archiveConfirmation.isOpen}
        onClose={() => setArchiveConfirmation({ isOpen: false, runnerId: '', runnerName: '' })}
        onConfirm={confirmArchiveRunner}
        title="Arquivar Corredor"
        message={`Tem certeza que deseja arquivar o corredor "${archiveConfirmation.runnerName}"? O corredor será movido para o arquivo e não aparecerá mais na lista principal.`}
        confirmText="Arquivar"
        cancelText="Cancelar"
        type="warning"
      />

      {/* Unarchive Confirmation Modal */}
      <ConfirmationModal
        isOpen={unarchiveConfirmation.isOpen}
        onClose={() => setUnarchiveConfirmation({ isOpen: false, runnerId: '', runnerName: '' })}
        onConfirm={confirmUnarchiveRunner}
        title="Desarquivar Corredor"
        message={`Tem certeza que deseja desarquivar o corredor "${unarchiveConfirmation.runnerName}"? O corredor voltará para a lista de corredores ativos.`}
        confirmText="Desarquivar"
        cancelText="Cancelar"
        type="info"
      />
    </div>
  );
};

export default RunnersPage;