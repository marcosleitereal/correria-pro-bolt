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
  // Get custom AI settings
  const systemPersona = getSetting('system_persona');
  const promptTemplate = getSetting('training_prompt_template');

  // Use custom template if available, otherwise use default
  if (promptTemplate) {
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

    return promptTemplate
      .replace('[runner_data]', runnerData)
      .replace('[style_data]', styleData)
      .replace('[period_data]', periodData)
      .replace(/\[athlete_first_name\]/g, firstName);
  }

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

  const defaultPrompt = `
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
`;

  // Apply custom system persona if available
  if (systemPersona) {
    return `${systemPersona}\n\n${defaultPrompt}`;
  }

  return defaultPrompt;
}

// Mock AI function - replace with actual AI integration
async function callAIForTraining(prompt: string): Promise<any> {
  console.log('🤖 FUNÇÃO MOCK DA IA INICIADA');
  console.log('📥 Prompt recebido pela IA:', prompt);

  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

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
  
  // Generate sessions based on duration
  const sessions = [];
  
  if (sessionCount === 1) {
    // Single day training
    sessions.push({
      day: 1,
      title: "Treino Intervalado de Velocidade",
      description: "Sessão de intervalos para desenvolvimento de velocidade",
      duration: "60 minutos",
      warmup: heartRateZones 
        ? `15 minutos de corrida leve (manter FC na Zona 2: ${heartRateZones.zone2}) + exercícios dinâmicos de mobilidade`
        : "15 minutos de corrida leve + exercícios dinâmicos",
      main_workout: heartRateZones
        ? `6x400m em ritmo de 5km com 90s de recuperação ativa. Durante os 400m, mantenha a FC na Zona 4 (${heartRateZones.zone4}). Na recuperação, deixe a FC baixar para Zona 2 (${heartRateZones.zone2})`
        : "6x400m em ritmo de 5km com 90s de recuperação",
      cooldown: heartRateZones
        ? `10 minutos de corrida leve (manter FC na Zona 1: ${heartRateZones.zone1}) + alongamento`
        : "10 minutos de corrida leve + alongamento",
      notes: heartRateZones
        ? `IMPORTANTE: Use monitor cardíaco durante todo o treino. Se não conseguir atingir a Zona 4 (${heartRateZones.zone4}), ajuste o ritmo gradualmente. Se a FC subir muito acima da zona, diminua o ritmo. O importante é manter a consistência nas zonas indicadas.`
        : "Manter ritmo consistente em todos os intervalos"
    });
  } else {
    // Multi-day training plan
    for (let i = 1; i <= Math.min(sessionCount, 7); i++) {
      if (i === 1) {
        sessions.push({
          day: i,
          title: "Treino Intervalado",
          description: "Sessão de intervalos para desenvolvimento de velocidade",
          duration: "60 minutos",
          warmup: heartRateZones 
            ? `15 minutos de corrida leve (manter FC na Zona 2: ${heartRateZones.zone2}) + exercícios dinâmicos de mobilidade`
            : "15 minutos de corrida leve + exercícios dinâmicos",
          main_workout: heartRateZones
            ? `6x400m em ritmo de 5km com 90s de recuperação ativa. Durante os 400m, mantenha a FC na Zona 4 (${heartRateZones.zone4}). Na recuperação, deixe a FC baixar para Zona 2 (${heartRateZones.zone2})`
            : "6x400m em ritmo de 5km com 90s de recuperação",
          cooldown: heartRateZones
            ? `10 minutos de corrida leve (manter FC na Zona 1: ${heartRateZones.zone1}) + alongamento`
            : "10 minutos de corrida leve + alongamento",
          notes: heartRateZones
            ? `IMPORTANTE: Use monitor cardíaco durante todo o treino. Se não conseguir atingir a Zona 4 (${heartRateZones.zone4}), ajuste o ritmo gradualmente. Se a FC subir muito acima da zona, diminua o ritmo.`
            : "Manter ritmo consistente em todos os intervalos"
        });
      } else if (i === 2) {
        sessions.push({
          day: i,
          title: "Recuperação Ativa",
          description: "Sessão de recuperação para facilitar a adaptação",
          duration: "45 minutos",
          warmup: "10 minutos de caminhada leve",
          main_workout: heartRateZones
            ? `30 minutos de corrida em ritmo conversacional (manter FC na Zona 2: ${heartRateZones.zone2}). O objetivo é manter um ritmo onde você consegue conversar normalmente durante toda a corrida`
            : "30 minutos de corrida em ritmo conversacional",
          cooldown: heartRateZones
            ? `10 minutos de alongamento (FC deve estar na Zona 1: ${heartRateZones.zone1})`
            : "10 minutos de alongamento",
          notes: heartRateZones
            ? `FOCO NA RECUPERAÇÃO: Se a FC subir acima da Zona 2 (${heartRateZones.zone2}), diminua o ritmo imediatamente. O treino de recuperação deve ser realmente leve e confortável.`
            : "Foco na recuperação, não force o ritmo"
        });
      } else {
        sessions.push({
          day: i,
          title: `Treino Dia ${i}`,
          description: "Sessão de treino personalizada",
          duration: "60 minutos",
          warmup: heartRateZones 
            ? `15 minutos de aquecimento progressivo (iniciar na Zona 1: ${heartRateZones.zone1} e terminar na Zona 2: ${heartRateZones.zone2})`
            : "15 minutos de aquecimento progressivo",
          main_workout: heartRateZones
            ? `Treino principal variado (alternar entre Zona 3: ${heartRateZones.zone3} para ritmo moderado e Zona 4: ${heartRateZones.zone4} para intensidade alta)`
            : "Treino principal variado",
          cooldown: heartRateZones
            ? `10 minutos de volta à calma (retornar gradualmente para Zona 1: ${heartRateZones.zone1})`
            : "10 minutos de volta à calma",
          notes: heartRateZones
            ? `MONITORAMENTO: Use o monitor cardíaco constantemente. Ajuste o ritmo conforme necessário para manter-se nas faixas indicadas. Zona 3 (${heartRateZones.zone3}) = ritmo moderado, Zona 4 (${heartRateZones.zone4}) = ritmo forte.`
            : "Ajuste o ritmo conforme sua condição física"
        });
      }
    }
  }

  console.log('📋 SESSÕES GERADAS PELA IA MOCK:', sessions);

  // Mock response with dynamic sessions
  const mockResponse = {
    title: "Treino Intervalado de Velocidade",
    description: "Plano focado no desenvolvimento da velocidade e resistência anaeróbica",
    duration: duration,
    sessions: sessions,
    tips: [
      heartRateZones 
        ? "ESSENCIAL: Use um monitor cardíaco para acompanhar suas zonas durante todo o treino"
        : "Monitore a frequência cardíaca",
      "Mantenha-se hidratado antes, durante e após o treino",
      "Respeite os tempos de recuperação entre os intervalos",
      heartRateZones
        ? "Se não conseguir atingir a zona indicada, ajuste o ritmo gradualmente - não force além do confortável"
        : "Ajuste o ritmo conforme sua condição física",
      "Em caso de desconforto ou dor, pare imediatamente e consulte seu treinador"
    ],
    equipment: heartRateZones ? [
      "Monitor cardíaco (essencial para acompanhar as zonas)",
      "Cronômetro", 
      "Tênis de corrida adequado",
      "Garrafa de água"
    ] : [
      "Cronômetro",
      "Tênis de corrida adequado", 
      "Garrafa de água",
      "Monitor cardíaco (recomendado)"
    ]
  };

  console.log('🎉 RESPOSTA FINAL DA IA MOCK:', mockResponse);
  return mockResponse;
}