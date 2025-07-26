import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Brain, Clock, Users, Target, Zap } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Analytics Avançado',
    description: 'Dashboards intuitivos que transformam dados complexos em insights acionáveis para melhorar a performance dos seus atletas.',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    icon: Brain,
    title: 'IA Personalizada',
    description: 'Algoritmos inteligentes que adaptam treinos automaticamente baseados no progresso e condições físicas de cada corredor.',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600'
  },
  {
    icon: Clock,
    title: 'Automação Completa',
    description: 'Elimine o trabalho manual. Planilhas se atualizam sozinhas, relatórios são gerados automaticamente.',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  {
    icon: Users,
    title: 'Gestão de Equipes',
    description: 'Gerencie múltiplos atletas simultaneamente com visão centralizada de performance e progressão individual.',
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600'
  },
  {
    icon: Target,
    title: 'Metas Inteligentes',
    description: 'Defina objetivos realistas e acompanhe o progresso com métricas precisas e alertas proativos.',
    bgColor: 'bg-pink-100',
    iconColor: 'text-pink-600'
  },
  {
    icon: Zap,
    title: 'Performance em Tempo Real',
    description: 'Monitore dados de treino em tempo real e ajuste estratégias instantaneamente para máxima eficiência.',
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600'
  }
];

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20 px-4 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Recursos que fazem a diferença
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Tecnologia de ponta desenvolvida especificamente para treinadores que buscam resultados excepcionais
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                <div className={`${feature.bgColor} w-16 h-16 rounded-full flex items-center justify-center mb-6`}>
                  <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;