import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Check, TrendingUp, Users, Clock, BarChart } from 'lucide-react';

const benefits = [
  'Redução de 80% no tempo gasto com planilhas',
  'Aumento de 45% na retenção de atletas',
  'Performance 3x mais consistente nos treinos',
  'Insights automáticos baseados em IA',
  'Relatórios profissionais em 1 clique',
  'Integração com todos os dispositivos populares'
];

const ProofSection: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Pare de perder tempo com planilhas complexas
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Mais de 10.000 treinadores já descobriram como a Correria.Pro transforma 
              a gestão de atletas em uma experiência simples e poderosa.
            </p>
            
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-slate-700 font-medium">{benefit}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            style={{ y }}
            className="relative"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Performance Dashboard</h3>
                <p className="text-slate-600">Visão completa dos seus atletas</p>
              </div>

              {/* Mock Stats Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Performance</p>
                      <p className="text-2xl font-bold text-blue-700">+23%</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Atletas Ativos</p>
                      <p className="text-2xl font-bold text-purple-700">47</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Chart */}
              <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-slate-700">Evolução Semanal</h4>
                  <BarChart className="w-5 h-5 text-slate-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full w-4/5"></div>
                    </div>
                    <span className="text-sm text-slate-600">80%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full w-3/5"></div>
                    </div>
                    <span className="text-sm text-slate-600">65%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full w-4/6"></div>
                    </div>
                    <span className="text-sm text-slate-600">70%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProofSection;