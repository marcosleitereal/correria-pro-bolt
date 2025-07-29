import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Users, Zap, Crown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plan } from '../types/database';
import { useAppSettings } from '../hooks/useAppSettings';

const PricingSection: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { getTrialDuration } = useAppSettings();

  useEffect(() => {
    fetchPublicPlans();
  }, []);

  const fetchPublicPlans = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) {
        throw error;
      }

      // Filter out admin-only plans
      const publicPlans = (data || []).filter(plan => {
        const isAdminPlan = plan.name?.toLowerCase().includes('admin') || 
                           plan.name?.toLowerCase().includes('restrito') ||
                           plan.price_monthly === 0;
        return !isAdminPlan;
      });
      
      setPlans(publicPlans);
    } catch (err: any) {
      console.error('Erro ao carregar planos:', err);
      // Em caso de erro, mostrar planos padrão
      setPlans([
        {
          id: '1',
          name: 'Tiro Livre',
          description: 'Perfeito para quem quer agilidade e controle desde o início.',
          price_monthly: 79.90,
          max_athletes: 30,
          is_active: true,
          is_popular: false,
          features: [
            'Dashboard de performance',
            'Geração de treinos com IA',
            'Até 30 atletas',
            'Exportação em PDF',
            'Suporte por email'
          ]
        },
        {
          id: '2',
          name: 'Profissional',
          description: 'Projetado para profissionais com rotinas intensas e bem definidas.',
          price_monthly: 129.90,
          max_athletes: 100,
          is_active: true,
          is_popular: true,
          features: [
            'Tudo do plano Tiro Livre',
            'Analytics avançados',
            'Templates personalizados',
            'Grupos de treino',
            'Suporte prioritário',
            'Integrações com dispositivos'
          ]
        },
        {
          id: '3',
          name: 'Elite',
          description: 'Recursos completos para quem comanda grandes equipes.',
          price_monthly: 229.90,
          max_athletes: 250,
          is_active: true,
          is_popular: false,
          features: [
            'Tudo do plano Profissional',
            'IA personalizada',
            'Consultoria especializada',
            'API para integrações',
            'Suporte 24/7 dedicado',
            'Recursos beta antecipados'
          ]
        }
      ] as Plan[]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getAthleteLimit = (limit: number) => {
    if (limit === -1) return 'Atletas ilimitados';
    return `Até ${limit} atletas ativos`;
  };

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('tiro') || planName.toLowerCase().includes('básico')) return Users;
    if (planName.toLowerCase().includes('profissional')) return Zap;
    if (planName.toLowerCase().includes('elite')) return Crown;
    return Users;
  };

  const getPlanFeatures = (plan: Plan) => {
    if (plan.features && Array.isArray(plan.features)) {
      return plan.features;
    }

    // Features padrão baseadas no nome do plano
    if (plan.name.toLowerCase().includes('tiro') || plan.name.toLowerCase().includes('básico')) {
      return [
        'Dashboard de performance',
        'Geração de treinos com IA',
        `Até ${plan.max_athletes === -1 ? '∞' : plan.max_athletes} atletas`,
        'Exportação em PDF',
        'Suporte por email'
      ];
    }

    if (plan.name.toLowerCase().includes('profissional')) {
      return [
        'Tudo do plano anterior',
        'Analytics avançados',
        'Templates personalizados',
        'Grupos de treino',
        'Suporte prioritário',
        'Integrações com dispositivos'
      ];
    }

    if (plan.name.toLowerCase().includes('elite')) {
      return [
        'Tudo do plano anterior',
        'IA personalizada',
        'Consultoria especializada',
        'API para integrações',
        'Suporte 24/7 dedicado',
        'Recursos beta antecipados'
      ];
    }

    return [
      'Dashboard completo',
      'Geração de treinos com IA',
      'Gestão de atletas',
      'Relatórios avançados',
      'Suporte técnico'
    ];
  };

  if (loading) {
    return (
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-8 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="h-4 bg-slate-200 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Planos feitos para quem leva a{' '}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              performance a sério
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            Escolha o plano ideal para o seu nível de operação e transforme a gestão dos seus atletas
          </p>

          {/* Trial Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="bg-green-500 text-white p-2 rounded-full">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-green-800">
                {getTrialDuration()} Dias Grátis para Testar
              </h3>
            </div>
            <p className="text-green-700">
              Experimente todas as funcionalidades sem compromisso. Não é necessário cartão de crédito.
            </p>
          </motion.div>
        </motion.div>

        {/* Plans Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {plans.map((plan, index) => {
            const PlanIcon = getPlanIcon(plan.name);
            const features = getPlanFeatures(plan);
            const featured = index === 1; // Make middle plan featured
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className={`bg-white rounded-2xl shadow-lg p-8 relative border-2 transition-all duration-300 ${
                  featured 
                    ? 'border-blue-500 scale-105 shadow-2xl' 
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-xl'
                }`}
              >
                {/* Featured Badge */}
                {featured && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                      <Star className="w-4 h-4 fill-current" />
                      Mais Popular
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    featured 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                      : 'bg-slate-100'
                  }`}>
                    <PlanIcon className={`w-8 h-8 ${featured ? 'text-white' : 'text-slate-600'}`} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {plan.name}
                  </h3>
                  
                  {plan.description && (
                    <p className="text-slate-600 mb-4">
                      {plan.description}
                    </p>
                  )}
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-slate-900">
                      {formatPrice(plan.price_monthly)}
                    </span>
                    <span className="text-slate-600 ml-2">/mês</span>
                  </div>

                  <p className="text-sm text-slate-600 flex items-center justify-center gap-2">
                    <Users className="w-4 h-4" />
                    {getAthleteLimit(plan.max_athletes)}
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  {features.map((feature, featureIndex) => (
                    <motion.div
                      key={featureIndex}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 + featureIndex * 0.05 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        featured 
                          ? 'bg-blue-500' 
                          : 'bg-green-500'
                      }`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Button */}
                <Link
                  to="/signup"
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg text-center transition-all duration-300 flex items-center justify-center gap-2 ${
                    featured
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-105 shadow-lg hover:shadow-xl'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {featured ? (
                    <>
                      <Star className="w-5 h-5" />
                      Começar Agora
                    </>
                  ) : (
                    'Escolher Plano'
                  )}
                </Link>

                {/* Trial Notice */}
                <p className="text-center text-xs text-slate-500 mt-4">
                  ✓ {getTrialDuration()} dias grátis • ✓ Sem compromisso • ✓ Cancele quando quiser
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Link
            to="/pricing"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Ver todos os detalhes dos planos
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;