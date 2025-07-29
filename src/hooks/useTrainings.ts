import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { Training } from '../types/database';
import { useAISettings } from './useAISettings';
import { toast } from 'sonner';

interface CreateTrainingData {
  title: string;
  target_type: 'individual' | 'group';
  target_id: string;
  duration: string;
  style_id: string;
  status: 'rascunho' | 'enviado';
}

export const useTrainings = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();
  const { getSetting } = useAISettings();

  useEffect(() => {
    if (!user) {
      setTrainings([]);
      setLoading(false);
      return;
    }

    fetchTrainings();
  }, [user]);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('trainings')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setTrainings(data || []);
    } catch (err: any) {
      console.error('Error fetching trainings:', err);
      setError(err.message || 'Erro ao carregar treinos');
      toast.error('Erro ao carregar treinos');
    } finally {
      setLoading(false);
    }
  };

  const createTraining = async (trainingData: CreateTrainingData): Promise<Training | null> => {
    if (!user) {
      setError('Usuário não autenticado');
      toast.error('Usuário não autenticado');
      return null;
    }

    setGenerating(true);
    toast.loading('Gerando treino com IA...', { id: 'generating-training' });
    try {
      setError(null);

      // First, get the target data (runner or group)
      const targetTable = trainingData.target_type === 'individual' ? 'runners' : 'training_groups';
      const { data: targetData, error: targetError } = await supabase
        .from(targetTable)
        .select('*')
        .eq('id', trainingData.target_id)
        .single();

      if (targetError) {
        throw targetError;
      }

      // Get the training style data
      const { data: styleData, error: styleError } = await supabase
        .from('training_styles')
        .select('*')
        .eq('id', trainingData.style_id)
        .single();

      if (styleError) {
        throw styleError;
      }

      // Assemble AI prompt
      const aiPrompt = assembleAIPrompt(
        targetData, 
        trainingData.duration, 
        styleData, 
        trainingData.target_type,
        getSetting
      );

      // Call AI to generate training content
      const aiContent = await callAIForTraining(aiPrompt);

      // Save to Supabase
      const dbData = {
        coach_id: user.id,
        title: trainingData.title,
        content: aiContent,
        status: trainingData.status,
        ...(trainingData.target_type === 'individual' 
          ? { runner_id: trainingData.target_id, group_id: null }
          : { group_id: trainingData.target_id, runner_id: null }
        )
      };

      const { data, error: createError } = await supabase
        .from('trainings')
        .insert(dbData)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setTrainings(prev => [data, ...prev]);
      toast.success('Treino gerado com sucesso!', { id: 'generating-training' });
      return data;
    } catch (err: any) {
      console.error('Error creating training:', err);
      setError(err.message || 'Erro ao gerar treino');
      toast.error('Erro ao gerar treino', { id: 'generating-training' });
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const updateTraining = async (trainingId: string, trainingData: Partial<Training>): Promise<boolean> => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('trainings')
        .update(trainingData)
        .eq('id', trainingId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setTrainings(prev => prev.map(training => 
        training.id === trainingId ? data : training
      ));
      
      if (trainingData.status === 'enviado') {
        toast.success('Treino finalizado e enviado!');
      } else {
        toast.success('Treino salvo como rascunho!');
      }
      return true;
    } catch (err: any) {
      console.error('Error updating training:', err);
      setError(err.message || 'Erro ao atualizar treino');
      toast.error('Erro ao atualizar treino');
      return false;
    }
  };

  const deleteTraining = async (trainingId: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('trainings')
        .delete()
        .eq('id', trainingId);

      if (deleteError) {
        throw deleteError;
      }

      setTrainings(prev => prev.filter(training => training.id !== trainingId));
      toast.success('Treino excluído com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Error deleting training:', err);
      setError(err.message || 'Erro ao excluir treino');
      toast.error('Erro ao excluir treino');
      return false;
    }
  };

  const draftTrainings = trainings.filter(t => t.status === 'rascunho');
  const finalizedTrainings = trainings.filter(t => t.status === 'enviado');

  const getTrainingById = (trainingId: string): Training | undefined => {
    return trainings.find(training => training.id === trainingId);
  };

  return {
    trainings,
    draftTrainings,
    finalizedTrainings,
    loading,
    generating,
    error,
    createTraining,
    updateTraining,
    deleteTraining,
    getTrainingById,
    refetch: fetchTrainings,
  };
};

// Helper function to assemble AI prompt
function assembleAIPrompt(
  target: any, 
  duration: string, 
  style: any, 
  targetType: 'individual' | 'group',
  getSetting: (key: string) => string | null
): string {
  console.log('🤖 AI PROMPT: Iniciando montagem do prompt personalizado');
  console.log('🤖 AI PROMPT: Target:', target.name);
  console.log('🤖 AI PROMPT: Duration:', duration);
  console.log('🤖 AI PROMPT: Style:', style.name);
  
  // Get custom AI settings
  const systemPersona = getSetting('system_persona');
  const promptTemplate = getSetting('training_prompt_template');
  
  console.log('🤖 AI PROMPT: System persona encontrado:', !!systemPersona);
  console.log('🤖 AI PROMPT: Template encontrado:', !!promptTemplate);

  // Use custom template if available, otherwise use default
  if (promptTemplate) {
    console.log('✅ AI PROMPT: Usando template personalizado do admin');
    const firstName = target.name.split(' ')[0];
    
    const runnerData = targetType === 'individual' ? `
Nome: ${target.name}
Nível: ${target.fitness_level}
Peso: ${target.weight_kg || 'Não informado'}kg
Altura: ${target.height_cm || 'Não informado'}cm
Meta principal: ${target.main_goal || 'Não informada'}
FC Repouso: ${target.resting_heart_rate || 'Não informada'}bpm
FC Máxima: ${target.max_heart_rate || 'Não informada'}bpm
${target.notes ? `Observações: ${target.notes}` : ''}
` : `
Nome do Grupo: ${target.name}
Descrição: ${target.description || 'Não informada'}
Nível: ${target.level || 'Misto'}
Status: ${target.status}
`;

    const styleData = `
Nome: ${style.name}
Descrição: ${style.description}
Intensidade: ${style.intensity}
${style.duration ? `Duração típica: ${style.duration}` : ''}
`;

    const durationMap = {
      daily: 'um dia',
      weekly: 'uma semana',
      biweekly: 'duas semanas',
      monthly: 'um mês'
    };

    const periodData = `Duração: ${durationMap[duration as keyof typeof durationMap]}`;

    let finalPrompt = promptTemplate
      .replace('[runner_data]', runnerData)
      .replace('[style_data]', styleData)
      .replace('[period_data]', periodData)
      .replace(/\[athlete_first_name\]/g, firstName);
    
    // Apply system persona if available
    if (systemPersona) {
      finalPrompt = `${systemPersona}\n\n${finalPrompt}`;
      console.log('✅ AI PROMPT: System persona aplicado ao template');
    }
    
    // Add variability elements
    const timestamp = new Date().toISOString();
    const randomSeed = Math.random().toString(36).substring(7);
    finalPrompt += `\n\nIMPORTANTE: Gere um treino ÚNICO e VARIADO. Timestamp: ${timestamp}, Seed: ${randomSeed}`;
    
    console.log('✅ AI PROMPT: Template final montado com variabilidade');
    return finalPrompt;
  }

  console.log('⚠️ AI PROMPT: Usando template padrão (sem personalização do admin)');
  
  // Fallback to default prompt if no custom template
  const durationMap = {
    daily: 'um dia',
    weekly: 'uma semana',
    biweekly: 'duas semanas',
    monthly: 'um mês'
  };

  const targetInfo = targetType === 'individual' 
    ? `corredor individual chamado ${target.name}, nível ${target.fitness_level}`
    : `grupo de treino "${target.name}" com nível ${target.level || 'misto'}`;

  let defaultPrompt = `
Crie um plano de treino detalhado para ${targetInfo} com duração de ${durationMap[duration as keyof typeof durationMap]}.

Estilo de treino selecionado: ${style.name}
Descrição do estilo: ${style.description}
Intensidade: ${style.intensity}
${style.duration ? `Duração típica: ${style.duration}` : ''}

${targetType === 'individual' ? `
Informações do corredor:
- Nome: ${target.name}
- Nível: ${target.fitness_level}
- Peso: ${target.weight_kg || 'Não informado'}kg
- Altura: ${target.height_cm || 'Não informado'}cm
- Meta principal: ${target.main_goal || 'Não informada'}
- FC Repouso: ${target.resting_heart_rate || 'Não informada'}bpm
- FC Máxima: ${target.max_heart_rate || 'Não informada'}bpm
${target.notes ? `- Observações: ${target.notes}` : ''}
` : `
Informações do grupo:
- Nome: ${target.name}
- Descrição: ${target.description || 'Não informada'}
- Nível: ${target.level || 'Misto'}
- Status: ${target.status}
`}

IMPORTANTE: Crie um treino ÚNICO e VARIADO. Mesmo com os mesmos parâmetros, varie:
- Exercícios específicos e sequências
- Tempos e intensidades dentro da faixa apropriada
- Observações e dicas personalizadas
- Estrutura das sessões

Timestamp de geração: ${new Date().toISOString()}
Seed de variabilidade: ${Math.random().toString(36).substring(7)}

Retorne um JSON estruturado com o seguinte formato:
{
  "title": "Título do treino",
  "description": "Descrição geral do plano",
  "duration": "${duration}",
  "sessions": [
    {
      "day": 1,
      "title": "Título da sessão",
      "description": "Descrição da sessão",
      "warmup": "Aquecimento detalhado",
      "main_workout": "Treino principal detalhado",
      "cooldown": "Volta à calma detalhada",
      "notes": "Observações importantes"
    }
  ],
  "tips": ["Dica 1", "Dica 2", "Dica 3"],
  "equipment": ["Equipamento 1", "Equipamento 2"]
}

Seja específico com distâncias, tempos, intensidades e zonas de frequência cardíaca quando aplicável.
Varie os exercícios e abordagens mesmo para parâmetros similares.
`;

  // Apply custom system persona if available
  if (systemPersona) {
    defaultPrompt = `${systemPersona}\n\n${defaultPrompt}`;
    console.log('✅ AI PROMPT: System persona aplicado ao prompt padrão');
  }

  console.log('✅ AI PROMPT: Prompt padrão montado com variabilidade');
  return defaultPrompt;
}

// Mock AI function - replace with actual AI integration
async function callAIForTraining(prompt: string): Promise<any> {
  console.log('🤖 FUNÇÃO MOCK DA IA INICIADA');
  console.log('📥 Prompt recebido pela IA:', prompt);
  console.log('📏 Tamanho do prompt:', prompt.length, 'caracteres');

  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

  // Extract variability seed from prompt for more randomness
  const seedMatch = prompt.match(/Seed[:\s]+([a-z0-9]+)/i);
  const seed = seedMatch ? seedMatch[1] : Math.random().toString(36).substring(7);
  console.log('🎲 VARIABILIDADE: Usando seed:', seed);
  
  // Create deterministic but varied randomness based on seed
  const seedNumber = parseInt(seed.replace(/[a-z]/g, ''), 36) || Math.random() * 1000;
  const variation = (seedNumber % 100) / 100; // 0 to 1
  
  // Extract duration from prompt to generate appropriate number of sessions
  const durationMatch = prompt.match(/duração de (um dia|uma semana|duas semanas|um mês)/i);
  let duration = "daily";
  let sessionCount = 1;
  
  if (durationMatch) {
    const durationText = durationMatch[1].toLowerCase();
    if (durationText.includes("uma semana")) {
      duration = "weekly";
      sessionCount = 7;
    } else if (durationText.includes("duas semanas")) {
      duration = "biweekly";
      sessionCount = 14;
    } else if (durationText.includes("um mês")) {
      duration = "monthly";
      sessionCount = 30;
    } else {
      duration = "daily";
      sessionCount = 1;
    }
  }

  console.log('⏱️ Duração detectada:', duration, 'Sessões:', sessionCount);
  console.log('🎲 Variação aplicada:', (variation * 100).toFixed(1) + '%');

  // NOVA ABORDAGEM: Extrair dados diretamente do prompt de forma mais robusta
  let heartRateZones = null;
  let age = null;
  
  // Tentar extrair idade de várias formas
  const agePatterns = [
    /(\d+)\s*anos/i,
    /idade:\s*(\d+)/i,
    /age:\s*(\d+)/i
  ];
  
  for (const pattern of agePatterns) {
    const match = prompt.match(pattern);
    if (match) {
      age = parseInt(match[1]);
      console.log('🎂 Idade extraída com padrão:', pattern, 'Idade:', age);
      break;
    }
  }
  
  // Se não encontrou idade, tentar extrair da data de nascimento
  if (!age) {
    const birthPatterns = [
      /Data de nascimento:\s*(\d{4}-\d{2}-\d{2})/i,
      /birth_date:\s*(\d{4}-\d{2}-\d{2})/i,
      /nascimento:\s*(\d{4}-\d{2}-\d{2})/i
    ];
    
    for (const pattern of birthPatterns) {
      const match = prompt.match(pattern);
      if (match) {
        const birthDate = new Date(match[1]);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        console.log('🎂 Idade calculada da data de nascimento:', age);
        break;
      }
    }
  }
  
  // Se ainda não tem idade, usar idade padrão baseada no nível
  if (!age) {
    if (prompt.toLowerCase().includes('iniciante') || prompt.toLowerCase().includes('beginner')) {
      age = 30; // Idade padrão para iniciantes
    } else if (prompt.toLowerCase().includes('intermediário') || prompt.toLowerCase().includes('intermediate')) {
      age = 35; // Idade padrão para intermediários
    } else if (prompt.toLowerCase().includes('avançado') || prompt.toLowerCase().includes('advanced')) {
      age = 40; // Idade padrão para avançados
    } else {
      age = 35; // Idade padrão geral
    }
    console.log('🎯 Usando idade padrão baseada no nível:', age);
  }
  
  // Calcular zonas cardíacas
  if (age) {
    const maxHR = Math.round(208 - (0.7 * age));
    heartRateZones = {
      zone1: `${Math.round(maxHR * 0.5)}-${Math.round(maxHR * 0.6)} bpm`,
      zone2: `${Math.round(maxHR * 0.6)}-${Math.round(maxHR * 0.7)} bpm`,
      zone3: `${Math.round(maxHR * 0.7)}-${Math.round(maxHR * 0.8)} bpm`,
      zone4: `${Math.round(maxHR * 0.8)}-${Math.round(maxHR * 0.9)} bpm`,
      zone5: `${Math.round(maxHR * 0.9)}-${maxHR} bpm`
    };
    console.log('✅ Zonas cardíacas calculadas - Idade:', age, 'FCmáx:', maxHR);
    console.log('📊 Zonas finais:', heartRateZones);
  }

  console.log('🎯 ZONAS CARDÍACAS FINAIS:', heartRateZones);
  
  // Arrays de variações para criar treinos diferentes
  const warmupVariations = [
    "corrida leve progressiva",
    "caminhada rápida seguida de trote",
    "corrida em ritmo conversacional",
    "aquecimento dinâmico com mobilidade"
  ];
  
  const cooldownVariations = [
    "corrida leve desacelerando gradualmente",
    "caminhada lenta com respiração controlada",
    "volta à calma progressiva",
    "relaxamento com alongamento dinâmico"
  ];
  
  const workoutVariations = [
    { intervals: "6x400m", recovery: "90s", pace: "ritmo de 5km" },
    { intervals: "5x600m", recovery: "2min", pace: "ritmo de 10km" },
    { intervals: "4x800m", recovery: "2min30s", pace: "ritmo de 5km" },
    { intervals: "8x300m", recovery: "60s", pace: "ritmo forte" }
  ];
  
  // Select variations based on seed for consistency but variety
  const warmupIndex = Math.floor(variation * warmupVariations.length);
  const cooldownIndex = Math.floor((variation * 2) % cooldownVariations.length);
  const workoutIndex = Math.floor((variation * 3) % workoutVariations.length);
  
  const selectedWarmup = warmupVariations[warmupIndex];
  const selectedCooldown = cooldownVariations[cooldownIndex];
  const selectedWorkout = workoutVariations[workoutIndex];
  
  console.log('🎲 VARIAÇÕES SELECIONADAS:', {
    warmup: selectedWarmup,
    cooldown: selectedCooldown,
    workout: selectedWorkout
  });
  
  // Generate sessions based on duration
  const sessions = [];
  
  if (sessionCount === 1) {
    // Single day training
    sessions.push({
      day: 1,
      title: `Treino ${selectedWorkout.pace.includes('5km') ? 'de Velocidade' : 'Intervalado'} ${seed.substring(0,3).toUpperCase()}`,
      description: `Sessão focada em ${selectedWorkout.pace} com ${selectedWorkout.intervals}`,
      duration: "60 minutos",
      warmup: heartRateZones 
        ? `15 minutos de ${selectedWarmup} (manter FC na Zona 2: ${heartRateZones.zone2}) + exercícios dinâmicos de mobilidade`
        : `15 minutos de ${selectedWarmup} + exercícios dinâmicos`,
      main_workout: heartRateZones
        ? `${selectedWorkout.intervals} em ${selectedWorkout.pace} com ${selectedWorkout.recovery} de recuperação ativa. Durante os intervalos, mantenha a FC na Zona 4 (${heartRateZones.zone4}). Na recuperação, deixe a FC baixar para Zona 2 (${heartRateZones.zone2})`
        : `${selectedWorkout.intervals} em ${selectedWorkout.pace} com ${selectedWorkout.recovery} de recuperação`,
      cooldown: heartRateZones
        ? `10 minutos de ${selectedCooldown} (manter FC na Zona 1: ${heartRateZones.zone1}) + alongamento`
        : `10 minutos de ${selectedCooldown} + alongamento`,
      notes: heartRateZones
        ? `IMPORTANTE: Use monitor cardíaco durante todo o treino. Se não conseguir atingir a Zona 4 (${heartRateZones.zone4}), ajuste o ritmo gradualmente. Foque na consistência dos ${selectedWorkout.intervals}. Variação ${seed}: mantenha atenção especial na recuperação de ${selectedWorkout.recovery}.`
        : `Manter ritmo consistente em todos os intervalos. Foque especialmente na recuperação de ${selectedWorkout.recovery} entre cada repetição.`
    });
  } else {
    // Multi-day training plan
    for (let i = 1; i <= Math.min(sessionCount, 7); i++) {
      const dayVariation = (variation + i * 0.1) % 1;
      const dayWarmupIndex = Math.floor(dayVariation * warmupVariations.length);
      const dayCooldownIndex = Math.floor((dayVariation * 2) % cooldownVariations.length);
      
      if (i === 1) {
        sessions.push({
          day: i,
          title: `Treino ${selectedWorkout.pace.includes('5km') ? 'de Velocidade' : 'Intervalado'} - Dia ${i}`,
          description: `Sessão focada em ${selectedWorkout.pace} - Variação ${seed.substring(0,2)}`,
          duration: "60 minutos",
          warmup: heartRateZones 
            ? `15 minutos de ${warmupVariations[dayWarmupIndex]} (manter FC na Zona 2: ${heartRateZones.zone2}) + exercícios dinâmicos de mobilidade`
            : `15 minutos de ${warmupVariations[dayWarmupIndex]} + exercícios dinâmicos`,
          main_workout: heartRateZones
            ? `${selectedWorkout.intervals} em ${selectedWorkout.pace} com ${selectedWorkout.recovery} de recuperação ativa. Durante os intervalos, mantenha a FC na Zona 4 (${heartRateZones.zone4}). Na recuperação, deixe a FC baixar para Zona 2 (${heartRateZones.zone2})`
            : `${selectedWorkout.intervals} em ${selectedWorkout.pace} com ${selectedWorkout.recovery} de recuperação`,
          cooldown: heartRateZones
            ? `10 minutos de ${cooldownVariations[dayCooldownIndex]} (manter FC na Zona 1: ${heartRateZones.zone1}) + alongamento`
            : `10 minutos de ${cooldownVariations[dayCooldownIndex]} + alongamento`,
          notes: heartRateZones
            ? `IMPORTANTE: Use monitor cardíaco durante todo o treino. Se não conseguir atingir a Zona 4 (${heartRateZones.zone4}), ajuste o ritmo gradualmente. Variação ${seed}: foque na consistência dos ${selectedWorkout.intervals}.`
            : `Manter ritmo consistente em todos os intervalos. Variação ${seed}: atenção especial na recuperação.`
        });
      } else if (i === 2) {
        sessions.push({
          day: i,
          title: `Recuperação Ativa - Dia ${i}`,
          description: `Sessão de recuperação personalizada - Método ${seed.substring(2,4)}`,
          duration: "45 minutos",
          warmup: "10 minutos de caminhada leve",
          main_workout: heartRateZones
            ? `${25 + Math.floor(dayVariation * 10)} minutos de corrida em ritmo conversacional (manter FC na Zona 2: ${heartRateZones.zone2}). O objetivo é manter um ritmo onde você consegue conversar normalmente durante toda a corrida`
            : `${25 + Math.floor(dayVariation * 10)} minutos de corrida em ritmo conversacional`,
          cooldown: heartRateZones
            ? `10 minutos de ${cooldownVariations[dayCooldownIndex]} (FC deve estar na Zona 1: ${heartRateZones.zone1})`
            : `10 minutos de ${cooldownVariations[dayCooldownIndex]}`,
          notes: heartRateZones
            ? `FOCO NA RECUPERAÇÃO: Se a FC subir acima da Zona 2 (${heartRateZones.zone2}), diminua o ritmo imediatamente. Variação ${seed}: mantenha o treino realmente leve e confortável.`
            : `Foco na recuperação, não force o ritmo. Variação ${seed}: priorize o conforto.`
        });
      } else {
        const sessionVariation = workoutVariations[Math.floor((dayVariation * workoutVariations.length)) % workoutVariations.length];
        sessions.push({
          day: i,
          title: `Treino Dia ${i} - ${sessionVariation.pace.includes('5km') ? 'Velocidade' : 'Resistência'}`,
          description: `Sessão personalizada com ${sessionVariation.intervals} - Variação ${seed.substring(i-1,i+1)}`,
          duration: "60 minutos",
          warmup: heartRateZones 
            ? `15 minutos de ${warmupVariations[dayWarmupIndex]} (iniciar na Zona 1: ${heartRateZones.zone1} e terminar na Zona 2: ${heartRateZones.zone2})`
            : `15 minutos de ${warmupVariations[dayWarmupIndex]}`,
          main_workout: heartRateZones
            ? `${sessionVariation.intervals} em ${sessionVariation.pace} com ${sessionVariation.recovery} de recuperação (alternar entre Zona 3: ${heartRateZones.zone3} para ritmo moderado e Zona 4: ${heartRateZones.zone4} para intensidade alta)`
            : `${sessionVariation.intervals} em ${sessionVariation.pace} com ${sessionVariation.recovery} de recuperação`,
          cooldown: heartRateZones
            ? `10 minutos de ${cooldownVariations[dayCooldownIndex]} (retornar gradualmente para Zona 1: ${heartRateZones.zone1})`
            : `10 minutos de ${cooldownVariations[dayCooldownIndex]}`,
          notes: heartRateZones
            ? `MONITORAMENTO: Use o monitor cardíaco constantemente. Ajuste o ritmo conforme necessário para manter-se nas faixas indicadas. Zona 3 (${heartRateZones.zone3}) = ritmo moderado, Zona 4 (${heartRateZones.zone4}) = ritmo forte. Variação ${seed}: foque nos ${sessionVariation.intervals}.`
            : `Ajuste o ritmo conforme sua condição física. Variação ${seed}: atenção especial aos intervalos de ${sessionVariation.recovery}.`
        });
      }
    }
  }

  console.log('📋 SESSÕES GERADAS PELA IA MOCK:', sessions);

  // Generate varied tips based on seed
  const tipVariations = [
    [
      "ESSENCIAL: Use um monitor cardíaco para acompanhar suas zonas durante todo o treino",
      "Mantenha-se hidratado antes, durante e após o treino",
      "Respeite os tempos de recuperação entre os intervalos",
      "Se não conseguir atingir a zona indicada, ajuste o ritmo gradualmente",
      "Em caso de desconforto ou dor, pare imediatamente"
    ],
    [
      "Monitor cardíaco é fundamental para treinos de qualidade",
      "Hidratação adequada é crucial para performance",
      "Recuperação ativa é tão importante quanto o treino principal",
      "Escute seu corpo e ajuste a intensidade conforme necessário",
      "Aquecimento adequado previne lesões"
    ],
    [
      "Controle de frequência cardíaca garante treino eficaz",
      "Beba água regularmente durante toda a sessão",
      "Intervalos de recuperação devem ser respeitados rigorosamente",
      "Adapte o ritmo às suas sensações corporais",
      "Pare imediatamente se sentir qualquer desconforto"
    ]
  ];
  
  const equipmentVariations = [
    ["Monitor cardíaco (essencial)", "Cronômetro", "Tênis de corrida adequado", "Garrafa de água"],
    ["Relógio esportivo com GPS", "Cronômetro", "Tênis apropriados para corrida", "Hidratação"],
    ["Monitor de frequência cardíaca", "Timer", "Calçado de corrida", "Água para hidratação"]
  ];
  
  const tipIndex = Math.floor(variation * tipVariations.length);
  const equipmentIndex = Math.floor((variation * 2) % equipmentVariations.length);

  // Mock response with dynamic sessions
  const mockResponse = {
    title: `Treino ${selectedWorkout.pace.includes('5km') ? 'de Velocidade' : 'Intervalado'} - ${seed.substring(0,4).toUpperCase()}`,
    description: `Plano focado no desenvolvimento da ${selectedWorkout.pace.includes('5km') ? 'velocidade e resistência anaeróbica' : 'resistência e capacidade aeróbica'} - Variação personalizada ${seed}`,
    duration: duration,
    sessions: sessions,
    tips: tipVariations[tipIndex],
    equipment: equipmentVariations[equipmentIndex]
  };

  console.log('🎉 RESPOSTA FINAL DA IA MOCK:', mockResponse);
  return mockResponse;
}