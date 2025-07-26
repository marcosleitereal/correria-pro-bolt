import React from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowRight, TrendingUp, Users, Target, Calendar, BarChart3, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

const HeroSection: React.FC = () => {
  const { user } = useAuthContext();

  return (
    <section className="min-h-screen bg-slate-50 flex items-center justify-center py-6 lg:py-3 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
              Menos Planilhas.{' '}
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Mais PERFORMANCE.
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-lg md:text-xl text-slate-600 mb-8 max-w-xl leading-relaxed"
            >
              A plataforma definitiva para treinadores de corrida que usam dados e IA para alcançar resultados extraordinários.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8"
            >
              <Link
                to={user ? '/dashboard' : '/signup'}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:scale-105 transition-transform duration-300 flex items-center gap-2 group"
              >
                {user ? 'Ir para Dashboard' : 'Criar Conta Gratuitamente'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              
              <Link
                to="/pricing"
                className="border-2 border-slate-300 text-slate-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-slate-400 hover:bg-slate-100 transition-all duration-300 flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Ver Planos
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="text-sm text-slate-500"
            >
              Mais de 10.000 treinadores confiam na Correria.Pro
            </motion.div>
          </motion.div>

          {/* Right Column - Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative mt-12 lg:mt-0"
          >
            <div className="relative transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 max-w-lg mx-auto">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Dashboard Correria.Pro</h3>
                    <p className="text-sm text-slate-600">Visão geral dos seus atletas</p>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="text-xs text-blue-600 font-medium">Performance</p>
                        <p className="text-lg font-bold text-blue-700">+23%</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                    className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-purple-600" />
                      <div>
                        <p className="text-xs text-purple-600 font-medium">Atletas</p>
                        <p className="text-lg font-bold text-purple-700">47</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Progress Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                  className="bg-slate-50 rounded-xl p-4 mb-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-700">Evolução Semanal</h4>
                    <BarChart3 className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '80%' }}
                          transition={{ duration: 1.5, delay: 1.2 }}
                          className="bg-gradient-to-r from-blue-500 to-blue-400 h-1.5 rounded-full"
                        ></motion.div>
                      </div>
                      <span className="text-xs text-slate-600">80%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '65%' }}
                          transition={{ duration: 1.5, delay: 1.4 }}
                          className="bg-gradient-to-r from-purple-500 to-purple-400 h-1.5 rounded-full"
                        ></motion.div>
                      </div>
                      <span className="text-xs text-slate-600">65%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '70%' }}
                          transition={{ duration: 1.5, delay: 1.6 }}
                          className="bg-gradient-to-r from-green-500 to-green-400 h-1.5 rounded-full"
                        ></motion.div>
                      </div>
                      <span className="text-xs text-slate-600">70%</span>
                    </div>
                  </div>
                </motion.div>

                {/* Recent Activities */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                >
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Treinos Recentes</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-slate-700">Treino Intervalado - João</span>
                      </div>
                      <span className="text-xs text-slate-500">Hoje</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-slate-700">Corrida Longa - Maria</span>
                      </div>
                      <span className="text-xs text-slate-500">Ontem</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span className="text-xs text-slate-700">Recuperação - Pedro</span>
                      </div>
                      <span className="text-xs text-slate-500">2 dias</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Floating Elements */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.5 }}
                className="absolute -top-4 -right-4 bg-gradient-to-r from-green-400 to-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg"
              >
                IA Ativa
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.7 }}
                className="absolute -bottom-4 -left-4 bg-gradient-to-r from-orange-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg"
              >
                Tempo Real
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;