import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Users, Zap, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Plan } from '../types/database';
import { useAppSettings } from '../hooks/useAppSettings';

interface PlanCardProps {
  plan: Plan;
  featured?: boolean;
  delay?: number;
  onSelect?: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, featured = false, delay = 0, onSelect }) => {
  const { settings } = useAppSettings();

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

  const getTrialDuration = () => {
    return settings?.trial_duration_days || 30;
  };

  const getPlanIcon = () => {
    if (plan.name.toLowerCase().includes('básico')) return Users;
    if (plan.name.toLowerCase().includes('profissional')) return Zap;
    if (plan.name.toLowerCase().includes('elite')) return Crown;
    return Users;
  };

  const getPlanFeatures = () => {
    // Default features if not in database
    const defaultFeatures = [
      'Dashboard completo de performance',
      'Geração automática de treinos com IA',
      'Histórico completo de atletas',
      'Exportação de treinos em PDF',
      'Suporte técnico por email',
      'Atualizações automáticas'
    ];

    // If plan has features in JSONB, use them, otherwise use defaults
    if (plan.features && Array.isArray(plan.features)) {
      return plan.features;
    }

    // Customize features based on plan name
    if (plan.name.toLowerCase().includes('básico')) {
      return [
        'Dashboard de performance',
        'Geração de treinos com IA',
        'Até ' + (plan.max_athletes === -1 ? '∞' : plan.max_athletes) + ' atletas',
        'Exportação em PDF',
        'Suporte por email'
      ];
    }

    if (plan.name.toLowerCase().includes('profissional')) {
      return [
        'Tudo do plano Básico',
        'Analytics avançados',
        'Templates personalizados',
        'Grupos de treino',
        'Suporte prioritário',
        'Integrações com dispositivos'
      ];
    }

    if (plan.name.toLowerCase().includes('elite')) {
      return [
        'Tudo do plano Profissional',
        'IA personalizada',
        'Consultoria especializada',
        'API para integrações',
        'Suporte 24/7 dedicado',
        'Recursos beta antecipados'
      ];
    }

    return defaultFeatures;
  };

  const PlanIcon = getPlanIcon();
  const features = getPlanFeatures();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
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
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: delay + 0.1 + index * 0.05 }}
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
      <button
        onClick={onSelect}
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
      </button>

      {/* Trial Notice */}
      <p className="text-center text-xs text-slate-500 mt-4">
        ✓ {getTrialDuration()} dias grátis • ✓ Sem compromisso • ✓ Cancele quando quiser
      </p>
    </motion.div>
  );
};

export default PlanCard;