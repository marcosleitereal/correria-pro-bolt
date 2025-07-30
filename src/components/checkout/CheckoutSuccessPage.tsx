import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Home, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(10);
  const [processingStatus, setProcessingStatus] = useState('Processando pagamento...');

  useEffect(() => {
    // AGUARDAR WEBHOOK PROCESSAR ANTES DE REDIRECIONAR
    console.log('💳 SUCCESS: Página de sucesso carregada com session_id:', sessionId);
    
    // FORÇAR ATIVAÇÃO IMEDIATA SE NECESSÁRIO
    if (sessionId) {
      console.log('🚀 SUCCESS: Forçando verificação de ativação...');
      
      // Múltiplos refreshes para garantir ativação
      const refreshTimes = [3000, 6000, 9000]; // 3s, 6s, 9s
      
      refreshTimes.forEach((time, index) => {
        setTimeout(() => {
          console.log(`🔄 SUCCESS: Refresh ${index + 1}/3 para detectar ativação...`);
          
          // Verificar se foi ativado
          fetch('/api/check-activation', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
          }).catch(() => {
            // Se API não existir, apenas recarregar
            window.location.reload();
          });
        }, time);
      });
    }
    
    if (sessionId) {
      // Simular progresso do processamento
      const statusUpdates = [
        { time: 0, message: 'Processando pagamento...' },
        { time: 2000, message: 'Pagamento confirmado!' },
        { time: 4000, message: 'Ativando sua conta...' },
        { time: 6000, message: 'Configurando acesso...' },
        { time: 8000, message: 'Quase pronto!' }
      ];
      
      statusUpdates.forEach(({ time, message }) => {
        setTimeout(() => {
          setProcessingStatus(message);
        }, time);
      });
    }
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          console.log('🔄 SUCCESS: Redirecionando para dashboard após processamento completo');
          window.location.href = '/dashboard';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-8"
          >
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Assinatura Ativada com Sucesso!
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              Parabéns! Sua assinatura foi processada e você já pode aproveitar todos os recursos premium da Correria.Pro.
            </p>
          </motion.div>

          {/* Session Info */}
          {sessionId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white rounded-lg p-4 mb-8 border border-slate-200"
            >
              <p className="text-sm text-slate-600">
                ID da Sessão: <span className="font-mono text-slate-800">{sessionId}</span>
              </p>
            </motion.div>
          )}

          {/* Processing Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <p className="text-blue-800 font-medium">{processingStatus}</p>
            </div>
            <p className="text-blue-600 text-sm">
              Aguarde enquanto ativamos sua conta...
            </p>
          </motion.div>
          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8"
          >
            <h3 className="font-semibold text-green-800 mb-3">O que você pode fazer agora:</h3>
            <ul className="text-left space-y-2 text-green-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Criar atletas ilimitados (conforme seu plano)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Gerar treinos com IA personalizada
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Acessar todos os recursos premium
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Suporte técnico prioritário
              </li>
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="space-y-4"
          >
            <Link
              to="/dashboard"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2"
            >
              Ir para Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/"
              className="w-full border-2 border-slate-300 text-slate-700 py-3 px-6 rounded-lg font-semibold hover:border-slate-400 hover:bg-slate-100 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Voltar ao Início
            </Link>
          </motion.div>

          {/* Auto Redirect Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-8 text-sm text-slate-500"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecionando em {countdown} segundos...
            </div>
            <p className="text-xs text-center text-slate-400">
              Aguardando ativação completa da conta...
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;