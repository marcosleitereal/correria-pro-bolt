import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Calendar, TrendingUp, Clock, Target, Share2, FileText, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useSubscriptionStatus } from '../../hooks/useSubscriptionStatus';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { useTrainings } from '../../hooks/useTrainings';
import { useRunners } from '../../hooks/useRunners';
import { useFeedbackCompletionRate } from '../../hooks/useFeedbackCompletionRate';
import SubscriptionGuard from '../ui/SubscriptionGuard';
import EmptyState from '../ui/EmptyState';
import WorkoutViewModal from '../training/WorkoutViewModal';
import Skeleton from '../ui/Skeleton';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { isTrialing, daysUntilTrialEnd } = useSubscriptionStatus();
  const { canAccessFeature, blockingReason } = useSubscriptionGuard();
  const { trainings, draftTrainings, finalizedTrainings, loading } = useTrainings();
  const { runners } = useRunners();
  const { 
    completionRate, 
    loading: completionRateLoading,
    getEngagementLevel,
    getEngagementColor,
    getEngagementMessage 
  } = useFeedbackCompletionRate();
  const [selectedTraining, setSelectedTraining] = React.useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);

  const handleViewTraining = (training: any) => {
    setSelectedTraining(training);
    setIsViewModalOpen(true);
  };

  // BLOQUEIO TOTAL PARA PLANO RESTRITO
  if (!canAccessFeature && blockingReason) {
    return (
      <div className="h-full bg-slate-50">
        <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 h-full">
          <SubscriptionGuard feature="general">
            <div></div>
          </SubscriptionGuard>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50">
      <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 h-full">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Olá, {profile?.name || 'Treinador'}! 👋
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Bem-vindo ao seu painel de controle. Aqui você pode gerenciar seus treinos e acompanhar o progresso dos seus atletas.
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dashboard/generate-training')}
          className="mt-4 lg:mt-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-lg whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          + Novo Treino
        </motion.button>
      </motion.div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-xl">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900">{runners.filter(r => !r.is_archived).length}</h3>
                <p className="text-base font-medium text-slate-700">Corredores Ativos</p>
                <p className="text-sm text-slate-600">{runners.filter(r => !r.is_archived).length} ativos</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-4 rounded-xl">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900">{trainings.length}</h3>
                <p className="text-base font-medium text-slate-700">Treinos este Mês</p>
                <p className="text-sm text-slate-600">{draftTrainings.length} rascunhos</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-4 rounded-xl">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <div>
                {completionRateLoading ? (
                  <>
                    <div className="h-8 bg-slate-200 rounded w-16 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-slate-200 rounded w-24 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-slate-200 rounded w-32 animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <h3 className={`text-3xl font-bold ${getEngagementColor(completionRate)}`}>
                      {completionRate}%
                    </h3>
                    <p className="text-base font-medium text-slate-700">Taxa de Engajamento</p>
                    <p className="text-sm text-slate-600">
                      {getEngagementLevel(completionRate)} - {getEngagementMessage(completionRate)}
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Continue de Onde Parou */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Continue de Onde Parou</h2>
            <Clock className="w-6 h-6 text-slate-500" />
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 lg:p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              ))}
            </div>
          ) : draftTrainings.length === 0 ? (
            <EmptyState
              icon={Target}
              title="Nenhum treino em andamento"
              description="Você não possui treinos em rascunho no momento. Que tal criar um novo treino para seus atletas?"
              actionText="+ Criar Primeiro Treino"
              onAction={() => navigate('/dashboard/generate-training')}
            />
          ) : (
            <div className="space-y-3">
              {draftTrainings.map((training, index) => (
                <motion.div
                  key={training.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-slate-900 mb-1">{training.title}</h4>
                    <p className="text-sm text-slate-600">
                      Criado em {new Date(training.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/dashboard/training/${training.id}/edit`)}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <FileText className="w-4 h-4" />
                    Continuar Editando
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Atividade Recente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Atividade Recente</h2>
            <Calendar className="w-6 h-6 text-slate-500" />
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 lg:p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              ))}
            </div>
          ) : finalizedTrainings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Nenhuma atividade recente"
              description="Suas atividades mais recentes aparecerão aqui. Comece criando treinos e gerenciando seus atletas."
              actionText="+ Criar Primeiro Treino"
              onAction={() => navigate('/dashboard/generate-training')}
            />
          ) : (
            <div className="space-y-3">
              {finalizedTrainings.map((training, index) => (
                <motion.div
                  key={training.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-slate-900 mb-1">{training.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                      <span>Finalizado em {new Date(training.updated_at).toLocaleDateString('pt-BR')}</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Enviado
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewTraining(training)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:scale-105 transition-transform duration-300 flex items-center gap-2 whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    Ver e Compartilhar
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Workout View Modal */}
      <WorkoutViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedTraining(null);
        }}
        training={selectedTraining}
      />
      </div>
    </div>
  );
};

export default DashboardPage;