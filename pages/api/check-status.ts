import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apenas aceitar requisições GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Método não permitido. Use GET.' 
    });
  }

  try {
    const { jobId } = req.query;

    // Validar se o jobId foi fornecido
    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ 
        error: 'jobId é obrigatório e deve ser uma string.' 
      });
    }

    console.log(`[${new Date().toISOString()}] Verificando status para jobId: ${jobId}`);

    // SIMULAÇÃO: Em uma implementação real, aqui você consultaria
    // o status real do job em um banco de dados, Redis, ou sistema de filas
    
    // Por enquanto, simular que todos os jobs foram concluídos com sucesso
    const simulatedOutput = {
      title: "Treino Intervalado Personalizado",
      description: "Plano de treino gerado com base nas especificações fornecidas",
      duration: "weekly",
      sessions: [
        {
          day: 1,
          title: "Treino de Velocidade",
          description: "Sessão focada no desenvolvimento da velocidade",
          warmup: "15 minutos de corrida leve + exercícios dinâmicos",
          main_workout: "6x400m em ritmo de 5km com 90s de recuperação",
          cooldown: "10 minutos de corrida leve + alongamento",
          notes: "Manter ritmo consistente em todos os intervalos"
        },
        {
          day: 2,
          title: "Recuperação Ativa",
          description: "Sessão de recuperação para facilitar a adaptação",
          warmup: "10 minutos de caminhada",
          main_workout: "30 minutos de corrida em ritmo conversacional",
          cooldown: "10 minutos de alongamento",
          notes: "Foco na recuperação, não force o ritmo"
        }
      ],
      tips: [
        "Mantenha-se hidratado durante todo o treino",
        "Respeite os tempos de recuperação",
        "Monitore a frequência cardíaca"
      ],
      equipment: ["Cronômetro", "Monitor cardíaco", "Tênis de corrida"]
    };

    // Retornar status de conclusão com dados simulados
    return res.status(200).json({
      status: 'completed',
      jobId: jobId,
      output: simulatedOutput,
      completedAt: new Date().toISOString(),
      message: 'Processo MetaGPT finalizado com sucesso.'
    });

  } catch (error) {
    console.error('[ERRO CRÍTICO] Falha ao verificar status do job:', error);
    
    return res.status(500).json({
      error: 'Erro interno do servidor ao verificar status do job.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}