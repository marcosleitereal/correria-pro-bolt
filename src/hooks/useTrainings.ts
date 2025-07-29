import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { Training } from '../types/database';
import { useAISettings } from './useAISettings';
import { AIProvider } from '../types/database';
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

  const createTraining = async (trainingData: CreateTrainingData, activeProvider: AIProvider | null): Promise<Training | null> => {
    const { user } = useAuthContext(); // Get user inside the function to ensure it's fresh
  }
    if (!user) {
      setError('Usuário não autenticado');
      toast.error('Usuário não autenticado');
      return null;
    }
    
    console.log('🔍 [createTraining] - Provedor recebido:', {
      hasProvider: !!activeProvider,
      providerName: activeProvider?.name,
      hasApiKey: !!activeProvider?.api_key_encrypted,
      model: activeProvider?.selected_model
    });
    
    if (!activeProvider) {
      setError('Provedor de IA não configurado ou não carregado. Verifique as configurações de IA.');
      toast.error('Provedor de IA não disponível.');
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

      // Call AI to generate training content, passing the activeProvider
      const aiContent = await callAIForTraining(aiPrompt, activeProvider);

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
**DADOS PESSOAIS:**
- Nome: ${target.name}
- Idade: ${target.birth_date ? calculateAge(target.birth_date) : 'Não informada'} anos
- Gênero: ${target.gender || 'Não informado'}
- Peso: ${target.weight_kg || 'Não informado'}kg
- Altura: ${target.height_cm || 'Não informado'}cm
- Meta principal: ${target.main_goal || 'Não informada'}
- Nível de condicionamento: ${getFitnessLevelLabel(target.fitness_level)}

**DADOS FISIOLÓGICOS:**
- FC Repouso: ${target.resting_heart_rate || 'Não informada'}bpm
- FC Máxima: ${target.max_heart_rate || 'Não informada'}bpm

**HISTÓRICO DE LESÕES:**
${formatInjuries(target.injuries)}

**CONDIÇÕES DE SAÚDE:**
${formatHealthConditions(target.health_conditions)}

**EXPERIÊNCIA DE TREINO PASSADA:**
${target.past_training_experience || 'Não informada - Considere como iniciante e adapte a progressão adequadamente'}

**CARACTERÍSTICAS FÍSICAS ESPECÍFICAS:**
${formatPhysicalCharacteristics(target.physical_characteristics)}

**PREFERÊNCIAS/RESTRIÇÕES ALIMENTARES:**
${target.dietary_preferences || 'Nenhuma restrição informada'}

**OBSERVAÇÕES MÉDICAS E IMPORTANTES:**
${target.notes || 'Nenhuma observação adicional'}
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
**DADOS COMPLETOS DO CORREDOR:**

**DADOS PESSOAIS:**
- Nome: ${target.name}
- Idade: ${target.birth_date ? calculateAge(target.birth_date) : 'Não informada'} anos
- Gênero: ${target.gender || 'Não informado'}
- Peso: ${target.weight_kg || 'Não informado'}kg
- Altura: ${target.height_cm || 'Não informado'}cm
- Meta principal: ${target.main_goal || 'Não informada'}
- Nível de condicionamento: ${getFitnessLevelLabel(target.fitness_level)}

**DADOS FISIOLÓGICOS:**
- FC Repouso: ${target.resting_heart_rate || 'Não informada'}bpm
- FC Máxima: ${target.max_heart_rate || 'Não informada'}bpm

**HISTÓRICO DE LESÕES:**
${formatInjuries(target.injuries)}

**CONDIÇÕES DE SAÚDE:**
${formatHealthConditions(target.health_conditions)}

**EXPERIÊNCIA DE TREINO PASSADA:**
${target.past_training_experience || 'Não informada - Considere como iniciante e adapte a progressão adequadamente'}

**CARACTERÍSTICAS FÍSICAS ESPECÍFICAS:**
${formatPhysicalCharacteristics(target.physical_characteristics)}

**PREFERÊNCIAS/RESTRIÇÕES ALIMENTARES:**
${target.dietary_preferences || 'Nenhuma restrição informada'}

**OBSERVAÇÕES MÉDICAS E IMPORTANTES:**
${target.notes || 'Nenhuma observação adicional'}
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

// Helper functions para formatar os dados da anamnese
function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

function getFitnessLevelLabel(level: string): string {
  const labels = {
    beginner: 'Iniciante',
    intermediate: 'Intermediário', 
    advanced: 'Avançado',
    professional: 'Profissional'
  };
  return labels[level as keyof typeof labels] || level;
}

function formatInjuries(injuries: any): string {
  if (!injuries) return 'Nenhuma lesão registrada';
  
  try {
    const injuriesArray = typeof injuries === 'string' ? JSON.parse(injuries) : injuries;
    if (!Array.isArray(injuriesArray) || injuriesArray.length === 0) {
      return 'Nenhuma lesão registrada';
    }
    
    return injuriesArray.map((injury: any, index: number) => 
      `${index + 1}. ${injury.nome || 'Lesão'} ${injury.lado ? `(${injury.lado})` : ''} - Status: ${injury.status || 'Não informado'} ${injury.observacoes ? `- ${injury.observacoes}` : ''}`
    ).join('\n');
  } catch {
    return 'Dados de lesões em formato inválido';
  }
}

function formatHealthConditions(conditions: any): string {
  if (!conditions) return 'Nenhuma condição de saúde registrada';
  
  try {
    const conditionsArray = typeof conditions === 'string' ? JSON.parse(conditions) : conditions;
    if (!Array.isArray(conditionsArray) || conditionsArray.length === 0) {
      return 'Nenhuma condição de saúde registrada';
    }
    
    return conditionsArray.map((condition: any, index: number) => 
      `${index + 1}. ${condition.nome || 'Condição'} ${condition.observacoes ? `- ${condition.observacoes}` : ''}`
    ).join('\n');
  } catch {
    return 'Dados de condições de saúde em formato inválido';
  }
}

function formatPhysicalCharacteristics(characteristics: any): string {
  if (!characteristics) return 'Nenhuma característica física específica registrada';
  
  try {
    const charObj = typeof characteristics === 'string' ? JSON.parse(characteristics) : characteristics;
    if (!charObj || typeof charObj !== 'object') {
      return 'Nenhuma característica física específica registrada';
    }
    
    const formatted = Object.entries(charObj).map(([key, value]) => 
      `- ${key}: ${value}`
    ).join('\n');
    
    return formatted || 'Nenhuma característica física específica registrada';
  } catch {
    return 'Dados de características físicas em formato inválido';
  }
}
// Mock AI function - replace with actual AI integration
async function callAIForTraining(prompt: string, activeProvider: any): Promise<any> {
  console.log('🤖 [callAIForTraining] - Iniciando chamada da IA');
  console.log('📥 [callAIForTraining] - Prompt completo a ser enviado:', prompt);
  console.log('📏 [callAIForTraining] - Tamanho do prompt:', prompt.length, 'caracteres');
  console.log('⚙️ [callAIForTraining] - Provedor ativo recebido:', activeProvider?.name || 'Nenhum');


  try {
    // CRÍTICO: Verificar se há provedor de IA configurado
    const { data: aiSettings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('setting_value')
      .eq('setting_name', 'global_ai_provider')
      .maybeSingle();
    
    const globalProviderName = aiSettings?.setting_value;

    if (settingsError || !globalProviderName || !activeProvider || activeProvider.name !== globalProviderName) {
      console.warn('⚠️ [callAIForTraining] - Nenhum provedor configurado ou ativo globalmente, usando função MOCK');
      return await mockAIGeneration(prompt);
    }

    console.log('🤖 [callAIForTraining] - Usando provedor configurado:', activeProvider.name);

    if (!activeProvider.api_key_encrypted) {
      console.warn('⚠️ [callAIForTraining] - Chave de API do provedor não configurada, usando MOCK');
      return await mockAIGeneration(prompt);
    }

    // Log the provider config being used (excluding sensitive keys)
    console.log('✅ [callAIForTraining] - Provedor configurado encontrado:', {
      name: activeProvider.name,
      selected_model: activeProvider.selected_model,
      is_active: activeProvider.is_active,
      is_global_default: activeProvider.is_global_default,
      has_api_key: !!activeProvider.api_key_encrypted
    });

    const providerConfig = activeProvider; // Use the activeProvider passed directly
    
    // CHAMADA REAL DA IA
    const aiResponse = await callRealAI(globalProvider, providerConfig, prompt);
    
    if (aiResponse) {
      console.log('✅ IA: Resposta recebida da IA real');
      return aiResponse;
    } else {
      console.warn('⚠️ IA: Falha na IA real, usando fallback MOCK');
      return await mockAIGeneration(prompt);
    }
    
  } catch (error) {
    console.error('❌ IA: Erro na chamada da IA real:', error);
    console.log('🔄 IA: Usando fallback MOCK devido ao erro');
    return await mockAIGeneration(prompt);
  }
}

// Função para chamar IA real
async function callRealAI(providerName: string, config: any, prompt: string): Promise<any> {
  try {
    console.log('🚀 [callRealAI] - Iniciando chamada para o provedor:', providerName);
    console.log('📝 [callRealAI] - Prompt final enviado para a API:', prompt);
    // Aqui você implementaria as chamadas reais para cada provedor
    if (provider === 'OpenAI') {
      return await callOpenAI(config.api_key_encrypted, config.selected_model, prompt);
    } else if (provider === 'Anthropic') {
      return await callAnthropic(config.api_key_encrypted, config.selected_model, prompt);
    } else if (provider === 'Groq') {
      return await callGroq(config.api_key_encrypted, config.selected_model, prompt);
    } else {
      console.warn('⚠️ [callRealAI] - Provedor não suportado:', providerName);
      return null;
    }
    
  } catch (error) {
    console.error('❌ IA REAL: Erro na chamada:', error);
    return null;
  }
}

// Implementações das chamadas reais (exemplo para OpenAI)
async function callOpenAI(apiKey: string, model: string, prompt: string): Promise<any> {
  try {
    console.log('🤖 [callOpenAI] - Fazendo chamada real para o modelo:', model);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8, // Adicionar variabilidade
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('❌ [callOpenAI] - Erro na resposta da API OpenAI:', response.status, errorBody);
      throw new Error(`OpenAI API error: ${response.status} - ${errorBody.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('[callOpenAI] - Resposta vazia da OpenAI');
    }
    console.log('✅ [callOpenAI] - Resposta bruta da OpenAI:', content);
    // Tentar parsear como JSON
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.warn('⚠️ OpenAI: Resposta não é JSON válido, usando como texto');
      return { error: 'Resposta da IA não está em formato JSON válido' };
    }
    
  } catch (error: any) {
    console.error('❌ OpenAI: Erro na chamada:', error);
    return null;
  }
}

// Placeholder para outros provedores
async function callAnthropic(apiKey: string, model: string, prompt: string): Promise<any> {
  console.log('🤖 [callAnthropic] - Implementação pendente');
  return null;
}

async function callGroq(apiKey: string, model: string, prompt: string): Promise<any> {
  console.log('🤖 [callGroq] - Implementação pendente');
  return null;
}

// Função MOCK melhorada (fallback)
async function mockAIGeneration(prompt: string): Promise<any> {
  console.log('🎭 [mockAIGeneration] - Usando geração simulada (MOCK)');
  console.log('📥 [mockAIGeneration] - Prompt recebido:', prompt.substring(0, 200) + '...');

  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

  // Extract variability seed from prompt for more randomness
  const seedMatch = prompt.match(/Seed[:\s]+([a-z0-9]+)/i);
  const seed = seedMatch ? seedMatch[1] : Math.random().toString(36).substring(7);
  console.log('🎲 MOCK: Usando seed para variabilidade:', seed);
  
  // Create deterministic but varied randomness based on seed
  const seedNumber = parseInt(seed.replace(/[a-z]/g, ''), 36) || Math.random() * 1000;
  const variation = (seedNumber % 100) / 100; // 0 to 1
  
  // VARIABILIDADE MÁXIMA: Arrays muito maiores para evitar repetição
  const warmupVariations = [
    "corrida leve progressiva de 10 minutos",
    "caminhada rápida de 5 min + trote leve de 10 min",
    "corrida em ritmo conversacional por 12 minutos",
    "aquecimento dinâmico com mobilidade articular de 8 min + corrida leve de 7 min",
    "trote suave de 15 minutos com acelerações progressivas",
    "caminhada energética de 3 min + corrida moderada de 12 min",
    "aquecimento específico com exercícios funcionais de 10 min + trote de 5 min",
    "corrida lenta e controlada por 14 minutos com foco na respiração"
  ];
  
  const cooldownVariations = [
    "corrida leve desacelerando gradualmente por 8 minutos",
    "caminhada lenta de 5 min + alongamento dinâmico de 10 min",
    "volta à calma progressiva com respiração controlada por 12 min",
    "relaxamento ativo com caminhada de 6 min + alongamento de 8 min",
    "corrida muito lenta por 4 min + caminhada de 4 min + alongamento de 7 min",
    "desaceleração gradual com foco na recuperação por 10 minutos",
    "volta à calma com exercícios de flexibilidade por 15 minutos",
    "caminhada meditativa de 8 min + alongamento passivo de 7 min"
  ];
  
  const workoutVariations = [
    { intervals: "6x400m", recovery: "90s", pace: "ritmo de 5km", description: "intervalos curtos e intensos" },
    { intervals: "5x600m", recovery: "2min", pace: "ritmo de 10km", description: "intervalos médios" },
    { intervals: "4x800m", recovery: "2min30s", pace: "ritmo de 5km", description: "intervalos longos" },
    { intervals: "8x300m", recovery: "60s", pace: "ritmo forte", description: "intervalos muito curtos" },
    { intervals: "3x1000m", recovery: "3min", pace: "ritmo de 10km", description: "intervalos de resistência" },
    { intervals: "10x200m", recovery: "45s", pace: "ritmo máximo", description: "velocidade pura" },
    { intervals: "4x1200m", recovery: "3min30s", pace: "ritmo de limiar", description: "resistência anaeróbica" },
    { intervals: "6x500m", recovery: "90s", pace: "ritmo de 3km", description: "potência aeróbica" }
  ];

  // Select variations based on seed for consistency but variety
  const warmupIndex = Math.floor(variation * warmupVariations.length);
  const cooldownIndex = Math.floor((variation * 2) % cooldownVariations.length);
  const workoutIndex = Math.floor((variation * 3) % workoutVariations.length);
  
  const selectedWarmup = warmupVariations[warmupIndex];
  const selectedCooldown = cooldownVariations[cooldownIndex];
  const selectedWorkout = workoutVariations[workoutIndex];
  
  console.log('🎲 MOCK: Variações selecionadas:', {
    warmup: selectedWarmup,
    cooldown: selectedCooldown,
    workout: selectedWorkout.description
  });

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

  console.log('⏱️ MOCK: Duração detectada:', duration, 'Sessões:', sessionCount);

  // Calcular zonas cardíacas se possível
  let heartRateZones = null;
  const ageMatch = prompt.match(/(\d+)\s*anos/i);
  if (ageMatch) {
    const age = parseInt(ageMatch[1]);
    const maxHR = Math.round(208 - (0.7 * age));
    heartRateZones = {
      zone1: `${Math.round(maxHR * 0.5)}-${Math.round(maxHR * 0.6)} bpm`,
      zone2: `${Math.round(maxHR * 0.6)}-${Math.round(maxHR * 0.7)} bpm`,
      zone3: `${Math.round(maxHR * 0.7)}-${Math.round(maxHR * 0.8)} bpm`,
      zone4: `${Math.round(maxHR * 0.8)}-${Math.round(maxHR * 0.9)} bpm`,
      zone5: `${Math.round(maxHR * 0.9)}-${maxHR} bpm`
    };
    console.log('✅ MOCK: Zonas cardíacas calculadas para idade', age);
  }

  // Generate sessions with MAXIMUM variability
  const sessions = [];
  
  if (sessionCount === 1) {
    // Single day training with maximum variation
    sessions.push({
      day: 1,
      title: `${selectedWorkout.description} - Variação ${seed.substring(0,4).toUpperCase()}`,
      description: `Sessão focada em ${selectedWorkout.pace} - Método ${seed.substring(2,5)}`,
      duration: `${55 + Math.floor(variation * 20)} minutos`, // 55-75 min
      warmup: heartRateZones 
        ? `${selectedWarmup} (manter FC na Zona 2: ${heartRateZones.zone2}) + exercícios dinâmicos específicos`
        : `${selectedWarmup} + exercícios dinâmicos de mobilidade`,
      main_workout: heartRateZones
        ? `${selectedWorkout.intervals} em ${selectedWorkout.pace} com ${selectedWorkout.recovery} de recuperação ativa. Durante os intervalos, mantenha a FC na Zona 4 (${heartRateZones.zone4}). Na recuperação, deixe a FC baixar para Zona 2 (${heartRateZones.zone2}). ${selectedWorkout.description}`
        : `${selectedWorkout.intervals} em ${selectedWorkout.pace} com ${selectedWorkout.recovery} de recuperação. Foque em ${selectedWorkout.description}`,
      cooldown: heartRateZones
        ? `${selectedCooldown} (manter FC na Zona 1: ${heartRateZones.zone1}) + alongamento específico`
        : `${selectedCooldown} + alongamento completo`,
      notes: heartRateZones
        ? `IMPORTANTE: Use monitor cardíaco durante todo o treino. Variação ${seed}: foque na consistência dos ${selectedWorkout.intervals}. Se não conseguir atingir a Zona 4 (${heartRateZones.zone4}), ajuste o ritmo gradualmente.`
        : `Manter ritmo consistente em todos os intervalos. Variação ${seed}: atenção especial na recuperação de ${selectedWorkout.recovery}.`
    });
  } else {
    // Multi-day training plan with varied sessions
    for (let i = 1; i <= Math.min(sessionCount, 7); i++) {
      const dayVariation = (variation + i * 0.15) % 1; // Mais variação entre dias
      const dayWarmupIndex = Math.floor(dayVariation * warmupVariations.length);
      const dayCooldownIndex = Math.floor((dayVariation * 2) % cooldownVariations.length);
      const dayWorkoutIndex = Math.floor((dayVariation * 3) % workoutVariations.length);
      
      const dayWarmup = warmupVariations[dayWarmupIndex];
      const dayCooldown = cooldownVariations[dayCooldownIndex];
      const dayWorkout = workoutVariations[dayWorkoutIndex];
      
      sessions.push({
        day: i,
        title: `Dia ${i} - ${dayWorkout.description} - ${seed.substring(i-1,i+2)}`,
        description: `Sessão personalizada com ${dayWorkout.intervals} - Variação ${seed.substring(i,i+3)}`,
        duration: `${50 + Math.floor(dayVariation * 30)} minutos`, // 50-80 min
        warmup: heartRateZones 
          ? `${dayWarmup} (iniciar na Zona 1: ${heartRateZones.zone1} e terminar na Zona 2: ${heartRateZones.zone2})`
          : dayWarmup,
        main_workout: heartRateZones
          ? `${dayWorkout.intervals} em ${dayWorkout.pace} com ${dayWorkout.recovery} de recuperação (alternar entre Zona 3: ${heartRateZones.zone3} para ritmo moderado e Zona 4: ${heartRateZones.zone4} para intensidade alta)`
          : `${dayWorkout.intervals} em ${dayWorkout.pace} com ${dayWorkout.recovery} de recuperação`,
        cooldown: heartRateZones
          ? `${dayCooldown} (retornar gradualmente para Zona 1: ${heartRateZones.zone1})`
          : dayCooldown,
        notes: heartRateZones
          ? `MONITORAMENTO: Use o monitor cardíaco constantemente. Variação ${seed}: foque nos ${dayWorkout.intervals}. Ajuste o ritmo conforme necessário para manter-se nas faixas indicadas.`
          : `Ajuste o ritmo conforme sua condição física. Variação ${seed}: atenção especial aos intervalos de ${dayWorkout.recovery}.`
      });
    }
  }

  console.log('📋 MOCK: Sessões geradas com máxima variabilidade:', sessions.length);

  // Generate varied tips and equipment
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
    ],
    [
      "Foque na técnica de corrida durante todo o treino",
      "Respiração controlada melhora a performance",
      "Varie o terreno quando possível para maior desafio",
      "Registre suas sensações pós-treino para análise",
      "Mantenha consistência na execução dos intervalos"
    ]
  ];
  
  const equipmentVariations = [
    ["Monitor cardíaco (essencial)", "Cronômetro", "Tênis de corrida adequado", "Garrafa de água"],
    ["Relógio esportivo com GPS", "Cronômetro", "Tênis apropriados para corrida", "Hidratação"],
    ["Monitor de frequência cardíaca", "Timer", "Calçado de corrida", "Água para hidratação"],
    ["GPS watch", "Aplicativo de cronômetro", "Tênis específicos para treino", "Sistema de hidratação"]
  ];
  
  const tipIndex = Math.floor(variation * tipVariations.length);
  const equipmentIndex = Math.floor((variation * 2) % equipmentVariations.length);

  // Mock response with MAXIMUM variability
  const mockResponse = {
    title: `${selectedWorkout.description} - Método ${seed.substring(0,6).toUpperCase()}`,
    description: `Plano focado no desenvolvimento da ${selectedWorkout.pace.includes('5km') ? 'velocidade e resistência anaeróbica' : 'resistência e capacidade aeróbica'} - Variação personalizada ${seed}`,
    duration: duration,
    sessions: sessions,
    tips: tipVariations[tipIndex],
    equipment: equipmentVariations[equipmentIndex]
  };

  console.log('🎉 MOCK: Resposta final com máxima variabilidade gerada');
  return mockResponse;
}