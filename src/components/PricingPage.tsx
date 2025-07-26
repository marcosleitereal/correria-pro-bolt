import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Star, Users, Zap, Shield, Clock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plan } from '../types/database';
import PlanCard from './PlanCard';
import CheckoutModal from './checkout/CheckoutModal';

const PricingPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  useEffect(() => {
    fetchActivePlans();
  }, []);

  const fetchActivePlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setPlans(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar planos:', err);
      setError('Erro ao carregar planos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const faqItems = [
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim, você pode cancelar sua assinatura a qualquer momento através do seu painel de controle. Não há multas ou taxas de cancelamento. Você continuará tendo acesso até o final do período já pago."
    },
    {
      question: "Como funciona a contagem de atletas?",
      answer: "Cada atleta ativo em sua conta conta para o limite do seu plano. Atletas arquivados não são contabilizados. Você pode arquivar e desarquivar atletas conforme necessário."
    },
    {
      question: "Quais métodos de pagamento são aceitos?",
      answer: "Aceitamos cartões de crédito e débito através do Stripe e Mercado Pago. Também oferecemos PIX e boleto bancário através do Mercado Pago para maior conveniência."
    },
    {
      question: "Como funciona o período de teste gratuito?",
      answer: "Você tem 30 dias para testar todas as funcionalidades da plataforma gratuitamente. Não é necessário cartão de crédito para começar. Após o período, você pode escolher um plano ou continuar com a versão gratuita limitada."
    },
    {
      question: "Há suporte técnico incluído?",
      answer: "Sim, todos os planos incluem suporte técnico completo via email e chat. Planos superiores têm prioridade no atendimento e acesso a consultoria especializada."
    },
    {
      question: "Posso fazer upgrade ou downgrade do meu plano?",
      answer: "Sim, você pode alterar seu plano a qualquer momento. Upgrades são aplicados imediatamente, e downgrades entram em vigor no próximo ciclo de cobrança."
    },
    {
      question: "Os dados dos meus atletas ficam seguros?",
      answer: "Absolutamente. Utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança. Todos os dados são armazenados em servidores seguros e em conformidade com a LGPD."
    },
    {
      question: "Posso exportar meus dados?",
      answer: "Sim, você pode exportar todos os seus dados a qualquer momento em formatos padrão (PDF, Excel). Seus dados sempre pertencem a você."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsCheckoutModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 text-blue-600" />
            <span className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Voltar ao início
            </span>
          </Link>
          
          <Link to="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Correria.Pro
            </h1>
          </Link>
          
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </nav>

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Planos feitos para quem leva a{' '}
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                performance a sério
              </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Escolha o plano ideal para o seu nível de operação e transforme a gestão dos seus atletas com tecnologia de ponta
            </p>

            {/* Trial Banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 max-w-2xl mx-auto"
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="bg-green-500 text-white p-2 rounded-full">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-green-800">
                  30 Dias Grátis para Testar
                </h3>
              </div>
              <p className="text-green-700">
                Experimente todas as funcionalidades sem compromisso. Não é necessário cartão de crédito.
              </p>
            </motion.div>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600">Carregando planos disponíveis...</p>
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 max-w-2xl mx-auto"
            >
              <p className="font-medium">Erro ao carregar planos</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchActivePlans}
                className="mt-3 text-red-600 hover:text-red-700 font-medium text-sm"
              >
                Tentar novamente
              </button>
            </motion.div>
          )}

          {/* Plans Grid */}
          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20"
            >
              {plans.map((plan, index) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  featured={index === 1} // Make middle plan featured
                  delay={index * 0.1}
                  onSelect={() => handlePlanSelect(plan)}
                />
              ))}
            </motion.div>
          )}

          {/* Features Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-20"
          >
            <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
              Todos os planos incluem
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Gestão de Atletas</h3>
                <p className="text-slate-600 text-sm">Perfis completos com métricas e histórico</p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">IA Avançada</h3>
                <p className="text-slate-600 text-sm">Geração automática de treinos personalizados</p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Segurança Total</h3>
                <p className="text-slate-600 text-sm">Dados protegidos e conformidade com LGPD</p>
              </div>

              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Suporte 24/7</h3>
                <p className="text-slate-600 text-sm">Atendimento especializado quando precisar</p>
              </div>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
              Perguntas Frequentes
            </h2>
            
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-slate-900">
                      {item.question}
                    </h3>
                    <motion.div
                      animate={{ rotate: openFAQ === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </button>
                  
                  <motion.div
                    initial={false}
                    animate={{
                      height: openFAQ === index ? 'auto' : 0,
                      opacity: openFAQ === index ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4">
                      <p className="text-slate-600 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-center mt-20"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">
                Pronto para revolucionar seus treinos?
              </h2>
              <p className="text-xl text-blue-100 mb-6">
                Junte-se a mais de 10.000 treinadores que já transformaram seus resultados
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform duration-300"
              >
                Começar Teste Gratuito
                <Star className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => {
          setIsCheckoutModalOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
      />
    </div>
  );
};

export default PricingPage;