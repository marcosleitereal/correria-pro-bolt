import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  Filter, 
  MessageSquare, 
  Copy, 
  Download, 
  Search,
  Star,
  Clock,
  Target,
  FileText
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useRunners } from '../../hooks/useRunners';
import { useTrainingHistory } from '../../hooks/useTrainingHistory';
import { useTrainingStyles } from '../../hooks/useTrainingStyles';
import EmptyState from '../ui/EmptyState';
import FeedbackModal from './FeedbackModal';
import WorkoutViewModal from '../training/WorkoutViewModal';

const RunnerHistoryPage: React.FC = () => {
  const { runnerId } = useParams<{ runnerId: string }>();
  const navigate = useNavigate();
  const { runners, getRunnerById, loading: runnersLoading, error: runnersError } = useRunners();
  const { styles } = useTrainingStyles();
  
  // ARQUITETURA ROBUSTA: Hook estabilizado sem loops infinitos
  const { 
    trainings, 
    loading, 
    error, 
    runnerId: hookRunnerId,
    fetchTrainingHistory,
    saveFeedback 
  } = useTrainingHistory(runnerId);

  const [runner, setRunner] = useState<any>(null);
  
  const [selectedStyleId, setSelectedStyleId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [highlightedTrainingId, setHighlightedTrainingId] = useState<string | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // STEP 1: Isolamento e Reconstrução da Lógica de Gerenciamento de Estado
  const handleOpenViewModal = (training: any) => {
    console.log('🎯 MODAL DEBUG: handleOpenViewModal chamado com treino:', training?.id);
    console.log('🎯 MODAL DEBUG: Dados do treino:', {
      id: training?.id,
      title: training?.title,
      content: !!training?.content,
      status: training?.status
    });
    
    // Definir o treino selecionado PRIMEIRO
    setSelectedTraining(training);
    console.log('🎯 MODAL DEBUG: selectedTraining definido');
    
    // Depois abrir o modal
    setIsViewModalOpen(true);
    console.log('🎯 MODAL DEBUG: isViewModalOpen definido como true');
  };

  const handleCloseViewModal = () => {
    console.log('🎯 MODAL DEBUG: handleCloseViewModal chamado');
    setIsViewModalOpen(false);
    setSelectedTraining(null);
    console.log('🎯 MODAL DEBUG: Modal fechado e treino limpo');
  };

  useEffect(() => {
    console.log('🔍 RunnerHistoryPage: Carregando dados para runnerId:', runnerId);
    
    if (runnerId && !runnersLoading && runners.length > 0) {
      const runnerData = getRunnerById(runnerId);
      console.log('👤 Dados do corredor encontrados:', runnerData);
      setRunner(runnerData);
      
    }
  }, [runnerId, getRunnerById, runnersLoading, runners]);

  // PARTE 4: Implementar navegação anchor-aware
  useEffect(() => {
    // Verificar se há âncora na URL para treino específico
    const hash = window.location.hash;
    if (hash.startsWith('#training-')) {
      const trainingId = hash.replace('#training-', '');
      console.log('🎯 Âncora detectada para treino:', trainingId);
      
      // Aguardar os treinos carregarem
      if (!loading && trainings.length > 0) {
        // Verificar se o treino existe na lista
        const targetTraining = trainings.find(t => t.id === trainingId);
        if (targetTraining) {
          console.log('✅ Treino encontrado, preparando scroll e highlight');
          
          // Destacar o treino temporariamente
          setHighlightedTrainingId(trainingId);
          
          // Aguardar um momento para o DOM renderizar
          setTimeout(() => {
            const trainingElement = document.getElementById(`training-${trainingId}`);
            if (trainingElement) {
              console.log('📍 Fazendo scroll para o treino');
              trainingElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
              
              // Remover highlight após 3 segundos
              setTimeout(() => {
                setHighlightedTrainingId(null);
                // Limpar hash da URL
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
              }, 3000);
            } else {
              console.warn('⚠️ Elemento do treino não encontrado no DOM');
            }
          }, 500);
        } else {
          console.warn('⚠️ Treino não encontrado na lista:', trainingId);
        }
      }
    }
  }, [loading, trainings]);

  // ARQUITETURA SIMPLIFICADA: useEffect que chama fetchTrainingHistory apenas quando filtros mudam
  useEffect(() => {
    if (hookRunnerId) {
      const filters = {
        startDate,
        endDate,
        styleId: selectedStyleId || undefined,
        searchTerm: searchTerm || undefined
      };
      console.log('🔄 RunnerHistoryPage: Aplicando filtros:', filters);
      fetchTrainingHistory(filters);
    }
  }, [hookRunnerId, startDate, endDate, selectedStyleId, searchTerm, fetchTrainingHistory]);

  const handleAddFeedback = (training: any) => {
    setSelectedTraining(training);
    setIsFeedbackModalOpen(true);
  };

  const handleRepeatWithAdjustments = (training: any) => {
    // Navigate to wizard with pre-filled data
    const searchParams = new URLSearchParams({
      runnerId: runnerId!,
      styleId: training.style_id || '',
      mode: 'repeat'
    });
    navigate(`/dashboard/generate-training?${searchParams.toString()}`);
  };

  const handleSaveFeedback = async (trainingId: string, feedbackText: string, rating: number) => {
    const success = await saveFeedback(trainingId, feedbackText, rating);
    if (success) {
      setIsFeedbackModalOpen(false);
      setSelectedTraining(null);
    }
    return success;
  };

  const getTrainingFeedback = (trainingId: string) => {
    const training = trainings.find(t => t.id === trainingId);
    return training?.athlete_feedback || null;
  };

  const getStyleName = (styleId: string) => {
    const style = styles.find(s => s.id === styleId);
    return style?.name || 'Estilo não encontrado';
  };

  const formatDateRange = (training: any) => {
    const startDate = new Date(training.created_at);
    const content = training.content;
    
    if (!content?.duration) return startDate.toLocaleDateString('pt-BR');

    const durationDays = {
      daily: 1,
      weekly: 7,
      biweekly: 14,
      monthly: 30
    };

    const days = durationDays[content.duration as keyof typeof durationDays] || 1;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);

    if (days === 1) {
      return startDate.toLocaleDateString('pt-BR');
    }

    return `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;
  };

  const getDurationLabel = (duration: string) => {
    const labels = {
      daily: 'Diário',
      weekly: 'Semanal',
      biweekly: 'Quinzenal',
      monthly: 'Mensal'
    };
    return labels[duration as keyof typeof labels] || duration;
  };

  // Loading state while runners are being fetched
  if (runnersLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-900">Carregando dados do corredor...</h2>
        </div>
      </div>
    );
  }

  // Error state for runners data
  if (runnersError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Erro ao carregar dados dos corredores</h2>
          <p className="text-slate-600 mb-6">
            Não foi possível carregar a lista de corredores. Verifique sua conexão e tente novamente.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => navigate('/runners')}
              className="bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
            >
              Voltar aos Corredores
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!runner) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Corredor não encontrado</h2>
          <button
            onClick={() => navigate('/runners')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300"
          >
            Voltar aos Corredores
          </button>
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
        className="flex items-center gap-4 mb-8"
      >
        <button
          onClick={() => navigate('/runners')}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Histórico de Treinos: {runner.name}
          </h1>
          <p className="text-lg text-slate-600">
            Acompanhe o progresso e gerencie o feedback dos treinos
          </p>
        </div>
      </motion.div>

      {/* Filters */}
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Buscar Treino
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Título do treino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data Inicial
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              placeholderText="Selecionar data"
              dateFormat="dd/MM/yyyy"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data Final
            </label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              placeholderText="Selecionar data"
              dateFormat="dd/MM/yyyy"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Style Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Estilo de Treino
            </label>
            <select
              value={selectedStyleId}
              onChange={(e) => setSelectedStyleId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Todos os estilos</option>
              {styles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(startDate || endDate || selectedStyleId || searchTerm) && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                setStartDate(null);
                setEndDate(null);
                setSelectedStyleId('');
                setSearchTerm('');
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8"
        >
          Erro ao carregar histórico: {error}
        </motion.div>
      )}

      {/* Training History */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : trainings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <EmptyState
            icon={Calendar}
            title="Nenhum treino encontrado"
            description={
              startDate || endDate || selectedStyleId || searchTerm
                ? "Não encontramos treinos com os filtros aplicados. Tente ajustar os critérios de busca."
                : "Este corredor ainda não possui treinos finalizados. Crie o primeiro treino para começar o histórico."
            }
            actionText="+ Criar Primeiro Treino"
            onAction={() => navigate('/dashboard/generate-training')}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          {trainings.map((training, index) => {
            const trainingFeedback = getTrainingFeedback(training.id);
            const isHighlighted = highlightedTrainingId === training.id;
            
            return (
              <motion.div
                key={training.id}
                id={`training-${training.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border ${
                  isHighlighted 
                    ? 'border-blue-500 bg-blue-50 shadow-2xl ring-4 ring-blue-200' 
                    : 'border-slate-100'
                }`}
              >
                {/* Training Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {training.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateRange(training)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span>{getStyleName(training.style_id || '')}</span>
                      </div>
                      {training.content?.duration && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{getDurationLabel(training.content.duration)}</span>
                        </div>
                      )}
                    </div>
                    
                    {training.content?.description && (
                      <p className="text-slate-700 mb-4 line-clamp-2">
                        {training.content.description}
                      </p>
                    )}
                  </div>

                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                    Finalizado
                  </span>
                </div>

                {/* Feedback Section */}
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Feedback do Atleta
                    </h4>
                    <button
                      onClick={() => handleAddFeedback(training)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                    >
                      {trainingFeedback ? 'Editar Feedback' : 'Adicionar Feedback'}
                    </button>
                  </div>
                  
                  {trainingFeedback ? (
                    <div>
                      {trainingFeedback.rating && (
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < trainingFeedback.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                          <span className="text-sm text-slate-600 ml-2">
                            ({trainingFeedback.rating}/5)
                          </span>
                        </div>
                      )}
                      <p className="text-slate-700 whitespace-pre-line">
                        {trainingFeedback.feedback_text}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Atualizado em {new Date(trainingFeedback.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">
                      Nenhum feedback registrado para este treino.
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleAddFeedback(training)}
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {trainingFeedback ? 'Editar Feedback' : 'Adicionar Feedback'}
                  </button>

                  <button
                    onClick={() => handleRepeatWithAdjustments(training)}
                    className="flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-100 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Repetir com Ajustes
                  </button>

                  <button
                    onClick={() => handleOpenViewModal(training)}
                    className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-100 transition-colors"
                    type="button"
                  >
                    <FileText className="w-4 h-4" />
                    Ver e Compartilhar
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          setSelectedTraining(null);
        }}
        training={selectedTraining}
        existingFeedback={selectedTraining ? getTrainingFeedback(selectedTraining.id) : null}
        onSave={handleSaveFeedback}
      />

      {/* Workout View Modal */}
      {/* STEP 3: Conexão Correta do Modal com Estado e Handlers */}
      <WorkoutViewModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        training={selectedTraining}
      />
    </div>
  );
};

export default RunnerHistoryPage;