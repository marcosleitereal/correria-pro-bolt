import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apenas aceitar requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Método não permitido. Use POST.' 
    });
  }

  try {
    const { prompt } = req.body;

    // Validar se o prompt foi fornecido
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ 
        error: 'Prompt é obrigatório e deve ser uma string.' 
      });
    }

    // Gerar um jobId único
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log para indicar que o processo seria iniciado
    console.log(`[${new Date().toISOString()}] Iniciando processo de geração para jobId: ${jobId}`);
    console.log(`[${new Date().toISOString()}] Prompt recebido: ${prompt.substring(0, 100)}...`);
    
    // IMPORTANTE: Aqui NÃO executamos a tarefa longa
    // Em uma implementação real, aqui você iniciaria o processo em background
    // Por exemplo: adicionaria o job a uma fila (Redis, Bull, etc.)
    
    // Retornar imediatamente com status 202 Accepted
    return res.status(202).json({
      status: 'processing_started',
      jobId: jobId,
      message: 'Processo de geração iniciado com sucesso. Use o jobId para verificar o status.'
    });

  } catch (error) {
    console.error('[ERRO CRÍTICO] Falha ao iniciar processo de geração:', error);
    
    return res.status(500).json({
      error: 'Erro interno do servidor ao iniciar o processo de geração.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}