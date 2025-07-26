import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Download, Copy, CheckCircle, Calendar, Clock, Target, User, Users } from 'lucide-react';
import { Training, Runner, TrainingGroup } from '../../types/database';
import { useRunners } from '../../hooks/useRunners';
import { useTrainingGroups } from '../../hooks/useTrainingGroups';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface WorkoutViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  training: Training | null;
}

interface TrainingSession {
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

const WorkoutViewModal: React.FC<WorkoutViewModalProps> = ({
  isOpen,
  onClose,
  training
}) => {
  // STEP 3: Verificação da Lógica Interna do Modal
  console.log('🎯 MODAL RENDER: WorkoutViewModal renderizado com props:', {
    isOpen,
    hasTraining: !!training,
    trainingId: training?.id,
    trainingTitle: training?.title
  });
  
  const { getRunnerById } = useRunners();
  const { getGroupById } = useTrainingGroups();
  const [target, setTarget] = useState<Runner | TrainingGroup | null>(null);
  const [content, setContent] = useState<TrainingContent | null>(null);
  const [copying, setCopying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.log('🎯 MODAL EFFECT: useEffect disparado:', { 
      isOpen, 
      hasTraining: !!training,
      trainingId: training?.id 
    });
    
    if (!training) return;

    // Load target (runner or group)
    if (training.runner_id) {
      const runner = getRunnerById(training.runner_id);
      setTarget(runner);
    } else if (training.group_id) {
      const group = getGroupById(training.group_id);
      setTarget(group);
    }

    // Parse training content
    try {
      const parsedContent = training.content;
      setContent(parsedContent);
    } catch (error) {
      console.error('Error parsing training content:', error);
    }
  }, [training, getRunnerById, getGroupById]);

  const getDurationLabel = (duration: string) => {
    const durationMap: { [key: string]: string } = {
      '1_week': '1 Semana',
      '2_weeks': '2 Semanas',
      '1_month': '1 Mês',
      '2_months': '2 Meses',
      '3_months': '3 Meses',
      '6_months': '6 Meses'
    };
    return durationMap[duration] || duration;
  };

  const getTargetIcon = () => {
    return training?.runner_id ? User : Users;
  };

  const formatWorkoutForWhatsApp = () => {
    if (!content || !target) return '';

    let text = `🏃‍♂️ *PLANO DE TREINO PERSONALIZADO* 🏃‍♀️\n\n`;
    text += `👤 *Para:* ${target.name}\n`;
    text += `📅 *Duração:* ${getDurationLabel(content.duration)}\n`;
    text += `🎯 *Objetivo:* ${content.title}\n\n`;

    if (content.description) {
      text += `📝 *Descrição:*\n${content.description}\n\n`;
    }

    text += `📋 *SESSÕES DE TREINO:*\n\n`;

    content.sessions.forEach((session, index) => {
      text += `*${session.day}º Dia - ${session.title}*\n`;
      if (session.description) {
        text += `${session.description}\n`;
      }
      if (session.duration) {
        text += `⏱️ Duração: ${session.duration}\n`;
      }
      text += `\n🔥 *Aquecimento:*\n${session.warmup}\n\n`;
      text += `💪 *Treino Principal:*\n${session.main_workout}\n\n`;
      text += `🧘‍♂️ *Volta à Calma:*\n${session.cooldown}\n`;
      
      if (session.notes) {
        text += `\n📌 *Observações:*\n${session.notes}\n`;
      }
      
      text += `\n${'─'.repeat(30)}\n\n`;
    });

    if (content.tips.length > 0) {
      text += `💡 *DICAS IMPORTANTES:*\n`;
      content.tips.forEach((tip, index) => {
        text += `${index + 1}. ${tip}\n`;
      });
      text += `\n`;
    }

    if (content.equipment.length > 0) {
      text += `🎒 *EQUIPAMENTOS RECOMENDADOS:*\n`;
      content.equipment.forEach((item) => {
        text += `• ${item}\n`;
      });
      text += `\n`;
    }

    text += `🌐 correria.pro\n\n`;
    text += `💪 Bons treinos e foco no objetivo! 🎯\n`;
    text += `🏃‍♂️ Vamos conquistar essa meta juntos! 🏆`;

    return text;
  };

  const handleWhatsAppShare = async () => {
    setCopying(true);
    try {
      const formattedText = formatWorkoutForWhatsApp();
      await navigator.clipboard.writeText(formattedText);
      
      // Criar URL do WhatsApp com texto pré-preenchido
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(formattedText)}`;
      window.open(whatsappUrl, '_blank');
      
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Erro ao copiar para clipboard:', error);
      // Fallback: abrir WhatsApp com texto mesmo sem copiar
      const formattedText = formatWorkoutForWhatsApp();
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(formattedText)}`;
      window.open(whatsappUrl, '_blank');
    } finally {
      setCopying(false);
    }
  };

  const handlePDFExport = async () => {
    if (!target) return;

    setGenerating(true);
    // toast.loading('Gerando PDF...', { id: 'pdf-export' });
    // toast.loading('Gerando PDF...', { id: 'pdf-export' });
    try {
      const element = document.getElementById('workout-to-share');
      if (!element) return;

      // Configure html2canvas for better quality
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename
      const filename = `Treino-${target.name.replace(/\s+/g, '-')}.pdf`;
      
      // Download the PDF
      pdf.save(filename);
      // toast.success('PDF baixado com sucesso!', { id: 'pdf-export' });
      // toast.success('PDF baixado com sucesso!', { id: 'pdf-export' });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      // toast.error('Erro ao gerar PDF', { id: 'pdf-export' });
      // toast.error('Erro ao gerar PDF', { id: 'pdf-export' });
    } finally {
      setGenerating(false);
    }
  };

  console.log('🎯 MODAL RENDER CHECK: Verificação de renderização:', {
    isOpen,
    hasTraining: !!training,
    hasContent: !!content,
    hasTarget: !!target,
    shouldRender: isOpen && training && content && target
  });
  
  if (!isOpen) {
    console.log('🎯 MODAL RENDER: Modal não está aberto, não renderizando');
    return null;
  }
  
  if (!training) {
    console.log('🎯 MODAL RENDER: Sem dados de treino, não renderizando');
    return null;
  }
  
  if (!content) {
    console.log('🎯 MODAL RENDER: Sem dados de conteúdo, não renderizando');
    return null;
  }
  
  if (!target) {
    console.log('🎯 MODAL RENDER: Sem dados de alvo (corredor/grupo), não renderizando');
    return null;
  }
  
  console.log('🎯 MODAL RENDER: ✅ Todas as condições atendidas, renderizando modal!');

  const TargetIcon = getTargetIcon();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Plano de Treino - {target.name}
                </h2>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <TargetIcon className="w-4 h-4" />
                    <span className="text-blue-100">
                      {training.runner_id ? 'Corredor Individual' : 'Grupo de Treino'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-blue-100">
                      {getDurationLabel(content.duration)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div id="workout-to-share" className="space-y-8">
              {/* Training Overview */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{content.title}</h3>
                {content.description && (
                  <p className="text-slate-700 leading-relaxed mb-4">{content.description}</p>
                )}
                <div className="flex items-center gap-6 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Duração: {getDurationLabel(content.duration)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Criado em: {new Date(training.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {/* Training Sessions */}
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-slate-900">Sessões de Treino</h4>
                {content.sessions.map((session, index) => (
                  <div key={index} className="bg-white border border-slate-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {session.day}
                      </div>
                      <div>
                        <h5 className="text-lg font-bold text-slate-900">{session.title}</h5>
                        {session.description && (
                          <p className="text-slate-600">{session.description}</p>
                        )}
                      </div>
                    </div>

                    {session.duration && (
                      <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span>Duração: {session.duration}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h6 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          🔥 Aquecimento
                        </h6>
                        <div className="text-slate-700 whitespace-pre-line bg-slate-50 p-4 rounded-lg">
                          {session.warmup}
                        </div>
                      </div>

                      <div>
                        <h6 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          💪 Treino Principal
                        </h6>
                        <div className="text-slate-700 whitespace-pre-line bg-slate-50 p-4 rounded-lg">
                          {session.main_workout}
                        </div>
                      </div>

                      <div>
                        <h6 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          🧘‍♂️ Volta à Calma
                        </h6>
                        <div className="text-slate-700 whitespace-pre-line bg-slate-50 p-4 rounded-lg">
                          {session.cooldown}
                        </div>
                      </div>
                    </div>

                    {session.notes && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <h6 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          📌 Observações
                        </h6>
                        <div className="text-slate-700 whitespace-pre-line bg-yellow-50 p-4 rounded-lg">
                          {session.notes}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Tips and Equipment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {content.tips.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      💡 Dicas Importantes
                    </h4>
                    <ul className="space-y-2">
                      {content.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                            {index + 1}
                          </div>
                          <span className="text-slate-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {content.equipment.length > 0 && (
                  <div className="bg-purple-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      🎒 Equipamentos Recomendados
                    </h4>
                    <ul className="space-y-2">
                      {content.equipment.map((item, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                          <span className="text-slate-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center py-6 border-t border-slate-200">
                <div className="text-slate-500 text-sm">
                  <p>Treino gerado por <strong>Correria.Pro</strong></p>
                  <p>correria.pro</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <div className="flex gap-4">
              <button
                onClick={handleWhatsAppShare}
                disabled={copying}
                className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {copying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Copiando e abrindo WhatsApp...
                  </>
                ) : copied ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Texto copiado! Abrindo WhatsApp...
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5" />
                    Enviar via WhatsApp
                  </>
                )}
              </button>

              <button
                onClick={handlePDFExport}
                disabled={generating}
                className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Exportar como PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WorkoutViewModal;