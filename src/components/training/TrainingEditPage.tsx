import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Check, 
  Plus, 
  Trash2, 
  GripVertical, 
  Clock, 
  MapPin, 
  Target,
  FileText,
  Loader2,
  AlertCircle,
  Share2
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useTrainings } from '../../hooks/useTrainings';
import { useRunners } from '../../hooks/useRunners';
import { useTrainingGroups } from '../../hooks/useTrainingGroups';
import { useObservationTemplates } from '../../hooks/useObservationTemplates';

interface TrainingSession {
  id: string;
  day: number;
  title: string;
  description: string;
  warmup: string;
  main_workout: string;
  cooldown: string;
  notes: string;
  duration?: string;
  distance?: string;
  intensity?: string;
}

interface TrainingContent {
  title: string;
  description: string;
  duration: string;
  sessions: TrainingSession[];
  tips: string[];
  equipment: string[];
}

const TrainingEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTrainingById, updateTraining, loading: trainingsLoading } = useTrainings();
  const { getRunnerById } = useRunners();
  const { getGroupById } = useTrainingGroups();
  const { templates } = useObservationTemplates();

  const [training, setTraining] = useState<any>(null);
  const [content, setContent] = useState<TrainingContent | null>(null);
  const [targetName, setTargetName] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTextarea, setActiveTextarea] = useState<string | null>(null);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [finalizedTraining, setFinalizedTraining] = useState<any>(null);

  useEffect(() => {
    if (id) {
      // Wait for trainings to load first
      if (!trainingsLoading) {
        loadTraining();
      }
    }
  }, [id, trainingsLoading]);

  const loadTraining = async () => {
    if (!id) return;

    try {
      setError(null);
      const trainingData = getTrainingById(id);
      
      if (!trainingData) {
        // If trainings are still loading, wait
        if (trainingsLoading) {
          return;
        }
        setError('Treino não encontrado ou você não tem permissão para acessá-lo');
        return;
      }

      setTraining(trainingData);
      
      // Ensure all sessions have valid string IDs for drag and drop
      let trainingContent = trainingData.content;
      
      // Validate training content structure
      if (!trainingContent || !Array.isArray(trainingContent.sessions)) {
        trainingContent = getDefaultContent();
      } else {
        trainingContent.sessions = trainingContent.sessions.map((session: any, index: number) => ({
          ...session,
          id: session.id ? String(session.id) : `session-${Date.now()}-${index}`,
          day: session.day || index + 1
        }));
      }
      
      // Ensure other required properties exist
      trainingContent = {
        ...getDefaultContent(),
        ...trainingContent,
        sessions: trainingContent.sessions || getDefaultContent().sessions
      };
      
      setContent(trainingContent);

      // Get target name
      if (trainingData.runner_id) {
        const runner = getRunnerById(trainingData.runner_id);
        setTargetName(runner?.name || 'Corredor');
      } else if (trainingData.group_id) {
        const group = getGroupById(trainingData.group_id);
        setTargetName(group?.name || 'Grupo');
      }
    } catch (err: any) {
      console.error('Error loading training:', err);
      setError('Erro ao carregar treino');
    }
  };

  const getDefaultContent = (): TrainingContent => ({
    title: 'Novo Treino',
    description: 'Descrição do treino',
    duration: 'weekly',
    sessions: [
      {
        id: '1',
        day: 1,
        title: 'Sessão de Treino',
        description: 'Descrição da sessão',
        duration: '60 minutos',
        warmup: 'Aquecimento',
        main_workout: 'Treino principal',
        cooldown: 'Volta à calma',
        notes: 'Observações'
      }
    ],
    tips: ['Dica 1', 'Dica 2'],
    equipment: ['Equipamento 1']
  });

  const updateContent = (newContent: TrainingContent) => {
    setContent(newContent);
  };

  const updateSession = (sessionId: string, field: string, value: string) => {
    if (!content) return;

    const updatedSessions = content.sessions.map(session =>
      session.id === sessionId ? { ...session, [field]: value } : session
    );

    updateContent({ ...content, sessions: updatedSessions });
  };

  const addSession = () => {
    if (!content) return;

    const newSession: TrainingSession = {
      id: Date.now().toString(),
      day: content.sessions.length + 1,
      title: 'Nova Sessão',
      description: 'Descrição da sessão',
      duration: '60 minutos',
      warmup: 'Aquecimento',
      main_workout: 'Treino principal',
      cooldown: 'Volta à calma',
      notes: 'Observações'
    };

    updateContent({
      ...content,
      sessions: [...content.sessions, newSession]
    });
  };

  const removeSession = (sessionId: string) => {
    if (!content) return;

    if (window.confirm('Tem certeza que deseja excluir esta sessão?')) {
      const updatedSessions = content.sessions
        .filter(session => session.id !== sessionId)
        .map((session, index) => ({ ...session, day: index + 1 }));

      updateContent({ ...content, sessions: updatedSessions });
    }
  };

  const onDragEnd = (result: any) => {
    if (!content || !result.destination) return;

    const items = Array.from(content.sessions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update day numbers
    const updatedSessions = items.map((session, index) => ({
      ...session,
      day: index + 1
    }));

    updateContent({ ...content, sessions: updatedSessions });
  };

  const handleSaveDraft = async () => {
    if (!training || !content) return;

    setSaving(true);
    try {
      const success = await updateTraining(training.id, {
        title: content.title,
        content: content,
        status: 'rascunho'
      });

      if (success) {
        // Show success feedback
        console.log('Rascunho salvo com sucesso');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    setShowFinalizeModal(true);
  };

  const confirmFinalize = async () => {
    if (!training || !content) return;

    setShowFinalizeModal(false);
    setFinalizing(true);
    try {
      const success = await updateTraining(training.id, {
        title: content.title,
        content: content,
        status: 'enviado'
      });

      if (success) {
        setFinalizedTraining({ ...training, content, status: 'enviado' });
        setShowShareModal(true);
        setFinalizing(false);
      }
    } catch (error) {
      console.error('Error finalizing training:', error);
    } finally {
      setFinalizing(false);
    }
  };

  const formatWorkoutForWhatsApp = (): string => {
    if (!content || !targetName) return '';

    let text = `🏃‍♂️ *PLANO DE TREINO PERSONALIZADO*\n\n`;
    text += `👤 *Atleta:* ${targetName}\n`;
    text += `⏱️ *Duração:* ${getDurationLabel(content.duration)}\n`;
    text += `🎯 *Título:* ${content.title}\n\n`;
    
    if (content.description) {
      text += `📝 *DESCRIÇÃO DO PLANO:*\n${content.description}\n\n`;
    }

    // Adicionar informações importantes do atleta se for treino individual
    if (training.runner_id) {
      const runner = getRunnerById(training.runner_id);
      if (runner) {
        text += `👨‍⚕️ *INFORMAÇÕES IMPORTANTES DO ATLETA:*\n`;
        
        if (runner.notes) {
          text += `⚠️ *Observações médicas importantes:* ${runner.notes}\n`;
        }
        
        if (runner.main_goal) {
          text += `🎯 *Meta principal:* ${runner.main_goal}\n`;
        }
        
        if (runner.resting_heart_rate || runner.max_heart_rate) {
          text += `❤️ *Frequência cardíaca:* `;
          if (runner.resting_heart_rate) text += `Repouso ${runner.resting_heart_rate}bpm `;
          if (runner.max_heart_rate) text += `Máxima ${runner.max_heart_rate}bpm`;
          text += `\n`;
        }
        
        text += `\n`;
      }
    }

    text += `🏋️‍♂️ *SESSÕES DE TREINO:*\n\n`;

    content.sessions.forEach((session, index) => {
      text += `📅 *DIA ${session.day} - ${session.title.toUpperCase()}*\n`;
      
      if (session.description) {
        text += `${session.description}\n\n`;
      }

      if (session.duration) {
        text += `⏱️ *Duração estimada:* ${session.duration}\n\n`;
      }

      text += `🔥 *AQUECIMENTO:*\n${session.warmup}\n\n`;
      text += `💪 *TREINO PRINCIPAL:*\n${session.main_workout}\n\n`;
      text += `🧘‍♂️ *VOLTA À CALMA:*\n${session.cooldown}\n\n`;
      
      if (session.notes) {
        text += `📌 *OBSERVAÇÕES IMPORTANTES:*\n${session.notes}\n\n`;
      }

      if (index < content.sessions.length - 1) {
        text += `━━━━━━━━━━━━━━━━━\n\n`;
      }
    });

    // Adicionar dicas se existirem
    if (content.tips && content.tips.length > 0) {
      text += `💡 *DICAS IMPORTANTES:*\n`;
      content.tips.forEach((tip, index) => {
        text += `${index + 1}. ${tip}\n`;
      });
      text += `\n`;
    }

    // Adicionar equipamentos se existirem
    if (content.equipment && content.equipment.length > 0) {
      text += `🎒 *EQUIPAMENTOS RECOMENDADOS:*\n`;
      content.equipment.forEach((item) => {
        text += `• ${item}\n`;
      });
      text += `\n`;
    }

    // Adicionar avisos de segurança se houver observações médicas
    if (training.runner_id) {
      const runner = getRunnerById(training.runner_id);
      if (runner?.notes) {
        text += `🚨 *ATENÇÃO ESPECIAL - CUIDADOS MÉDICOS:*\n`;
        text += `• ⛔ Em caso de dor ou desconforto, PARE imediatamente\n`;
        text += `• 🩺 Respeite os limites do seu corpo\n`;
        text += `• 📞 Comunique qualquer sintoma ao seu treinador\n`;
        text += `• 💧 Mantenha-se sempre hidratado\n`;
        text += `• ⚠️ Devido às suas observações médicas, monitore-se constantemente\n\n`;
      }
    }

    // Adicionar link de feedback público
    if (training.public_feedback_token) {
      text += `📝 *FEEDBACK DO TREINO:*\n`;
      text += `Para deixar seu feedback sobre este treino, acesse:\n`;
      text += `https://correria.pro/feedback/${training.public_feedback_token}\n\n`;
    }

    text += `📱 *Treino gerado por Correria.Pro*\n`;
    text += `🌐 correria.pro\n\n`;
    text += `💪 Bons treinos e foco no objetivo! 🎯\n`;
    text += `🏃‍♂️ Vamos conquistar essa meta juntos! 🏆`;
    
    return text;
  };

  const insertTemplate = (templateText: string) => {
    if (!activeTextarea || !content) return;

    const [sessionId, field] = activeTextarea.split('.');
    const session = content.sessions.find(s => s.id === sessionId);
    
    if (session && field in session) {
      const currentValue = session[field as keyof TrainingSession] as string;
      const newValue = currentValue + (currentValue ? '\n\n' : '') + templateText;
      updateSession(sessionId, field, newValue);
    }
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

  const handleShareWhatsApp = async () => {
    const formattedText = formatWorkoutForWhatsApp();
    
    try {
      await navigator.clipboard.writeText(formattedText);
      
      // Criar URL do WhatsApp com texto pré-preenchido
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(formattedText)}`;
      window.open(whatsappUrl, '_blank');
      
      setShowShareModal(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      // Fallback: apenas abrir WhatsApp
      window.open('https://wa.me/', '_blank');
      setShowShareModal(false);
      navigate('/dashboard');
    }
  };

  const getStatusBadge = () => {
    if (!training) return null;

    const statusConfig = {
      rascunho: { label: 'Rascunho', color: 'bg-yellow-100 text-yellow-700' },
      enviado: { label: 'Enviado', color: 'bg-blue-100 text-blue-700' },
      concluido: { label: 'Concluído', color: 'bg-green-100 text-green-700' }
    };

    const config = statusConfig[training.status as keyof typeof statusConfig];
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (trainingsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Carregando treino...</p>
        </div>
      </div>
    );
  }

  if (error || !training || !content) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Erro ao Carregar Treino</h2>
          <p className="text-slate-600 mb-6">{error || 'Treino não encontrado'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed Action Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-40 lg:pl-64">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                Editando Treino de: {targetName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                {getStatusBadge()}
                <span className="text-xs sm:text-sm text-slate-600">
                  Criado em {new Date(training.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleSaveDraft}
              disabled={saving || training.status === 'enviado'}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Salvar Rascunho</span>
              <span className="sm:hidden">Salvar</span>
            </button>

            <button
              onClick={handleFinalize}
              disabled={finalizing || training.status === 'enviado'}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
            >
              {finalizing && <Loader2 className="w-4 h-4 animate-spin" />}
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Finalizar e Enviar</span>
              <span className="sm:hidden">Finalizar</span>
            </button>
          </div>
        </div>

        {/* Finalize Confirmation Modal */}
        <AnimatePresence>
          {showFinalizeModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
                  <h3 className="text-xl font-bold">Finalizar Treino</h3>
                  <p className="text-green-100">Confirme para enviar o treino</p>
                </div>
                
                <div className="p-6">
                  <p className="text-slate-700 mb-6">
                    Tem certeza que deseja finalizar este treino? Após finalizado, ele não poderá mais ser editado.
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowFinalizeModal(false)}
                      className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmFinalize}
                      disabled={finalizing}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      {finalizing && <Loader2 className="w-4 h-4 animate-spin" />}
                      <Check className="w-4 h-4" />
                      Finalizar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Share Modal */}
        <AnimatePresence>
          {showShareModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
                  <div className="flex items-center gap-3">
                    <Check className="w-8 h-8 bg-white text-green-500 rounded-full p-1" />
                    <div>
                      <h3 className="text-xl font-bold">Treino Finalizado!</h3>
                      <p className="text-blue-100">Pronto para compartilhar</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-slate-700 mb-6">
                    Seu treino foi finalizado com sucesso! Deseja compartilhar com o atleta via WhatsApp?
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowShareModal(false);
                        navigate('/dashboard');
                      }}
                      className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
                    >
                      Pular
                    </button>
                    <button
                      onClick={handleShareWhatsApp}
                      className="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Compartilhar no WhatsApp
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="pt-32 sm:pt-24 lg:pl-64 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Training Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-xl p-6 shadow-lg mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Título do Treino
                </label>
                <input
                  type="text"
                  value={content.title}
                  onChange={(e) => updateContent({ ...content, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Título do treino"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Duração do Plano
                </label>
                <select
                  value={content.duration}
                  onChange={(e) => updateContent({ ...content, duration: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quinzenal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descrição Geral
              </label>
              <textarea
                value={content.description}
                onChange={(e) => updateContent({ ...content, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Descrição geral do plano de treino"
              />
            </div>
          </motion.div>

          {/* Observation Templates */}
          {templates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-lg mb-8"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Observações Rápidas
              </h3>
              <div className="flex flex-wrap gap-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => insertTemplate(template.content)}
                    disabled={!activeTextarea}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
              {activeTextarea && (
                <p className="text-xs text-slate-600 mt-2">
                  Clique em um template para inserir no campo ativo
                </p>
              )}
            </motion.div>
          )}

          {/* Training Sessions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Sessões de Treino</h2>
              <button
                onClick={addSession}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar Sessão
              </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sessions">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                    <AnimatePresence>
                      {content.sessions.map((session, index) => (
                        <Draggable key={session.id} draggableId={session.id} index={index}>
                          {(provided, snapshot) => (
                            <motion.div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3 }}
                              className={`bg-white rounded-xl p-6 shadow-lg border border-slate-100 ${
                                snapshot.isDragging ? 'shadow-2xl scale-105' : ''
                              }`}
                            >
                              {/* Session Header */}
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="p-2 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing"
                                  >
                                    <GripVertical className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-slate-900">
                                      Dia {session.day}
                                    </h3>
                                    <p className="text-sm text-slate-600">Sessão de treino</p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => removeSession(session.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Excluir sessão"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Session Form */}
                              <div className="space-y-6">
                                {/* Title and Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                      Título da Sessão
                                    </label>
                                    <input
                                      type="text"
                                      value={session.title}
                                      onChange={(e) => updateSession(session.id, 'title', e.target.value)}
                                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                      placeholder="Ex: Treino Intervalado"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                      Duração Estimada
                                    </label>
                                    <div className="relative">
                                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                      <input
                                        type="text"
                                       value={session.duration || ''}
                                        onChange={(e) => updateSession(session.id, 'duration', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Ex: 60 minutos"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Description */}
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Descrição da Sessão
                                  </label>
                                  <textarea
                                    value={session.description}
                                    onChange={(e) => updateSession(session.id, 'description', e.target.value)}
                                    onFocus={() => setActiveTextarea(`${session.id}.description`)}
                                    onBlur={() => setActiveTextarea(null)}
                                    rows={2}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                    placeholder="Descrição geral da sessão"
                                  />
                                </div>

                                {/* Workout Phases */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                      Aquecimento
                                    </label>
                                    <textarea
                                      value={session.warmup}
                                      onChange={(e) => updateSession(session.id, 'warmup', e.target.value)}
                                      onFocus={() => setActiveTextarea(`${session.id}.warmup`)}
                                      onBlur={() => setActiveTextarea(null)}
                                      rows={4}
                                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                      placeholder="Descreva o aquecimento"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                      Treino Principal
                                    </label>
                                    <textarea
                                      value={session.main_workout}
                                      onChange={(e) => updateSession(session.id, 'main_workout', e.target.value)}
                                      onFocus={() => setActiveTextarea(`${session.id}.main_workout`)}
                                      onBlur={() => setActiveTextarea(null)}
                                      rows={4}
                                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                      placeholder="Descreva o treino principal"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                      Volta à Calma
                                    </label>
                                    <textarea
                                      value={session.cooldown}
                                      onChange={(e) => updateSession(session.id, 'cooldown', e.target.value)}
                                      onFocus={() => setActiveTextarea(`${session.id}.cooldown`)}
                                      onBlur={() => setActiveTextarea(null)}
                                      rows={4}
                                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                      placeholder="Descreva a volta à calma"
                                    />
                                  </div>
                                </div>

                                {/* Notes */}
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Observações e Dicas
                                  </label>
                                  <textarea
                                    value={session.notes}
                                    onChange={(e) => updateSession(session.id, 'notes', e.target.value)}
                                    onFocus={() => setActiveTextarea(`${session.id}.notes`)}
                                    onBlur={() => setActiveTextarea(null)}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                    placeholder="Observações importantes para esta sessão"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </Draggable>
                      ))}
                    </AnimatePresence>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Training Tips and Equipment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          >
            {/* Tips */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Dicas Importantes</h3>
              <div className="space-y-3">
                {content.tips.map((tip, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={tip}
                      onChange={(e) => {
                        const newTips = [...content.tips];
                        newTips[index] = e.target.value;
                        updateContent({ ...content, tips: newTips });
                      }}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Digite uma dica"
                    />
                    <button
                      onClick={() => {
                        const newTips = content.tips.filter((_, i) => i !== index);
                        updateContent({ ...content, tips: newTips });
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateContent({ ...content, tips: [...content.tips, ''] })}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Dica
                </button>
              </div>
            </div>

            {/* Equipment */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Equipamentos Recomendados</h3>
              <div className="space-y-3">
                {content.equipment.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newEquipment = [...content.equipment];
                        newEquipment[index] = e.target.value;
                        updateContent({ ...content, equipment: newEquipment });
                      }}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Digite um equipamento"
                    />
                    <button
                      onClick={() => {
                        const newEquipment = content.equipment.filter((_, i) => i !== index);
                        updateContent({ ...content, equipment: newEquipment });
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateContent({ ...content, equipment: [...content.equipment, ''] })}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Equipamento
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TrainingEditPage;