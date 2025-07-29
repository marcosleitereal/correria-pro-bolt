import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, User, Users, Check, Loader2, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRunners } from '../../hooks/useRunners';
import { useTrainingGroups } from '../../hooks/useTrainingGroups';
import { useTrainingStyles } from '../../hooks/useTrainingStyles';
import { useTrainings } from '../../hooks/useTrainings';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import SubscriptionGuard from '../ui/SubscriptionGuard';
import { Runner, TrainingGroup, TrainingStyle } from '../../types/database';

type TargetType = 'individual' | 'group';
type Duration = 'daily' | 'weekly' | 'biweekly' | 'monthly';

interface WizardState {
  step: number;
  targetType: TargetType | null;
  selectedTarget: Runner | TrainingGroup | null;
  duration: Duration | null;
  selectedStyle: TrainingStyle | null;
}

const TrainingWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { runners } = useRunners();
  const { groups } = useTrainingGroups();
  const { styles, favoriteStyles } = useTrainingStyles();
  const { createTraining, generating } = useTrainings();
  const { canAccessFeature, blockingReason, loading: guardLoading } = useSubscriptionGuard();

  // Filtrar apenas corredores ativos (não arquivados)
  const activeRunners = runners.filter(runner => !runner.is_archived);

  const [wizardState, setWizardState] = useState<WizardState>({
    step: 1,
    targetType: null,
    selectedTarget: null,
    duration: null,
    selectedStyle: null
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showOtherStyles, setShowOtherStyles] = useState(false);

  // Handle pre-filled data from URL params (for "Repeat with Adjustments")
  useEffect(() => {
    const prefilledRunnerId = searchParams.get('runnerId');
    const prefilledStyleId = searchParams.get('styleId');
    const mode = searchParams.get('mode');

    if (mode === 'repeat' && prefilledRunnerId) {
      // Pre-fill runner selection
      const runner = runners.find(r => r.id === prefilledRunnerId);
      if (runner) {
        setWizardState(prev => ({
          ...prev,
          targetType: 'individual',
          selectedTarget: runner
        }));
      }

      // Pre-fill style selection if available
      if (prefilledStyleId) {
        const style = styles.find(s => s.id === prefilledStyleId);
        if (style) {
          setWizardState(prev => ({
            ...prev,
            selectedStyle: style
          }));
        }
      }
    }
  }, [searchParams, runners, styles]);
  const targetOptions = wizardState.targetType === 'individual' ? activeRunners : groups;
  const filteredTargets = targetOptions.filter(target =>
    target.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const otherStyles = styles.filter(style => 
    !favoriteStyles.some(fav => fav.id === style.id)
  );

  const durationOptions = [
    { key: 'daily', label: 'Diário', description: 'Treino para hoje' },
    { key: 'weekly', label: 'Semanal', description: 'Plano de 7 dias' },
    { key: 'biweekly', label: 'Quinzenal', description: 'Plano de 14 dias' },
    { key: 'monthly', label: 'Mensal', description: 'Plano de 30 dias' }
  ];

  const canProceed = () => {
    switch (wizardState.step) {
      case 1:
        return wizardState.targetType && wizardState.selectedTarget;
      case 2:
        return wizardState.duration;
      case 3:
        return wizardState.selectedStyle;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && wizardState.step < 3) {
      setWizardState(prev => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const prevStep = () => {
    if (wizardState.step > 1) {
      setWizardState(prev => ({ ...prev, step: prev.step - 1 }));
    }
  };

  const handleTargetTypeSelect = (type: TargetType) => {
    setWizardState(prev => ({
      ...prev,
      targetType: type,
      selectedTarget: null
    }));
    setSearchTerm('');
  };

  const handleTargetSelect = (target: Runner | TrainingGroup) => {
    setWizardState(prev => ({ ...prev, selectedTarget: target }));
  };

  const handleDurationSelect = (duration: Duration) => {
    setWizardState(prev => ({ ...prev, duration }));
  };

  const handleStyleSelect = (style: TrainingStyle) => {
    setWizardState(prev => ({ ...prev, selectedStyle: style }));
  };

  const generateTraining = async () => {
    if (!canProceed()) return;

    const { selectedTarget, duration, selectedStyle, targetType } = wizardState;

    try {
      const trainingData = {
        title: `Treino ${selectedStyle!.name} - ${selectedTarget!.name}`,
        target_type: targetType!,
        target_id: selectedTarget!.id,
        duration: duration!,
        style_id: selectedStyle!.id,
        status: 'rascunho' as const
      };

      const newTraining = await createTraining(trainingData);
      
      if (newTraining) {
        navigate(`/dashboard/training/${newTraining.id}/edit`);
      }
    } catch (error) {
      console.error('Error generating training:', error);
    }
  };

  const getStepTitle = () => {
    switch (wizardState.step) {
      case 1:
        return 'Para quem é o treino?';
      case 2:
        return 'Qual a duração do plano?';
      case 3:
        return 'Qual metodologia aplicar?';
      default:
        return '';
    }
  };

  // AGUARDAR CARREGAMENTO ANTES DE DECIDIR BLOQUEIO
  if (guardLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando wizard...</p>
        </div>
      </div>
    );
  }

  // BLOQUEIO TOTAL PARA PLANO RESTRITO OU SEM ACESSO
  if (!canAccessFeature) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <SubscriptionGuard feature="general">
            <div></div>
          </SubscriptionGuard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Gerar Novo Treino</h1>
              <p className="text-slate-600">Crie treinos personalizados com IA</p>
            </div>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step <= wizardState.step
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {step < wizardState.step ? <Check className="w-4 h-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-24 h-1 mx-4 ${
                    step < wizardState.step ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <h2 className="text-xl font-semibold text-slate-900">{getStepTitle()}</h2>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={wizardState.step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-8 shadow-lg mb-8"
          >
            {/* Step 1: Target Selection */}
            {wizardState.step === 1 && (
              <div className="space-y-6">
                {/* Target Type Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <button
                    onClick={() => handleTargetTypeSelect('individual')}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                      wizardState.targetType === 'individual'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <User className={`w-8 h-8 mb-4 ${
                      wizardState.targetType === 'individual' ? 'text-blue-600' : 'text-slate-500'
                    }`} />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Corredor Individual</h3>
                    <p className="text-slate-600">Criar treino personalizado para um atleta específico</p>
                  </button>

                  <button
                    onClick={() => handleTargetTypeSelect('group')}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                      wizardState.targetType === 'group'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Users className={`w-8 h-8 mb-4 ${
                      wizardState.targetType === 'group' ? 'text-blue-600' : 'text-slate-500'
                    }`} />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Grupo de Treino</h3>
                    <p className="text-slate-600">Criar treino para um grupo de corredores</p>
                  </button>
                </div>

                {/* Target Selection */}
                {wizardState.targetType && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Selecione {wizardState.targetType === 'individual' ? 'o corredor' : 'o grupo'}:
                    </label>
                    
                    <div className="relative mb-4">
                      <input
                        type="text"
                        placeholder={`Buscar ${wizardState.targetType === 'individual' ? 'corredor' : 'grupo'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredTargets.map((target) => (
                        <button
                          key={target.id}
                          onClick={() => handleTargetSelect(target)}
                          className={`w-full p-4 rounded-lg border text-left transition-all duration-300 ${
                            wizardState.selectedTarget?.id === target.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <h4 className="font-semibold text-slate-900">{target.name}</h4>
                          {wizardState.targetType === 'individual' && 'fitness_level' in target && (
                            <p className="text-sm text-slate-600">
                              Nível: {target.fitness_level === 'beginner' ? 'Iniciante' : 
                                     target.fitness_level === 'intermediate' ? 'Intermediário' :
                                     target.fitness_level === 'advanced' ? 'Avançado' : 'Profissional'}
                            </p>
                          )}
                          {wizardState.targetType === 'group' && 'level' in target && target.level && (
                            <p className="text-sm text-slate-600">
                              Nível: {target.level === 'iniciante' ? 'Iniciante' : 
                                     target.level === 'intermediario' ? 'Intermediário' : 'Avançado'}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>

                    {filteredTargets.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-slate-500">
                          {searchTerm 
                            ? `Nenhum ${wizardState.targetType === 'individual' ? 'corredor' : 'grupo'} encontrado`
                            : `Você ainda não possui ${wizardState.targetType === 'individual' ? 'corredores' : 'grupos'} cadastrados`
                          }
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* Step 2: Duration Selection */}
            {wizardState.step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {durationOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleDurationSelect(option.key as Duration)}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                      wizardState.duration === option.key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{option.label}</h3>
                    <p className="text-slate-600">{option.description}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Step 3: Style Selection */}
            {wizardState.step === 3 && (
              <div className="space-y-6">
                {/* Favorite Styles */}
                {favoriteStyles.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                      Meus Favoritos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {favoriteStyles.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => handleStyleSelect(style)}
                          className={`p-4 rounded-lg border text-left transition-all duration-300 ${
                            wizardState.selectedStyle?.id === style.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <h4 className="font-semibold text-slate-900 mb-1">{style.name}</h4>
                          <p className="text-sm text-slate-600 mb-2">{style.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            {style.duration && <span>Duração: {style.duration}</span>}
                            {style.intensity && <span>Intensidade: {style.intensity}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Styles */}
                {otherStyles.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowOtherStyles(!showOtherStyles)}
                      className="flex items-center justify-between w-full text-left mb-4"
                    >
                      <h3 className="text-lg font-semibold text-slate-900">
                        Outros Estilos ({otherStyles.length})
                      </h3>
                      <motion.div
                        animate={{ rotate: showOtherStyles ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ArrowRight className="w-5 h-5 text-slate-500" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {showOtherStyles && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          {otherStyles.map((style) => (
                            <button
                              key={style.id}
                              onClick={() => handleStyleSelect(style)}
                              className={`p-4 rounded-lg border text-left transition-all duration-300 ${
                                wizardState.selectedStyle?.id === style.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <h4 className="font-semibold text-slate-900 mb-1">{style.name}</h4>
                              <p className="text-sm text-slate-600 mb-2">{style.description}</p>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                {style.duration && <span>Duração: {style.duration}</span>}
                                {style.intensity && <span>Intensidade: {style.intensity}</span>}
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {favoriteStyles.length === 0 && otherStyles.length === 0 && (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">
                      Você ainda não possui estilos de treino cadastrados.
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <button
            onClick={prevStep}
            disabled={wizardState.step === 1}
            className="flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </button>

          {wizardState.step < 3 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={generateTraining}
              disabled={!canProceed() || generating}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {generating && <Loader2 className="w-5 h-5 animate-spin" />}
              <Sparkles className="w-5 h-5" />
              Gerar Rascunho do Treino
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TrainingWizardPage;