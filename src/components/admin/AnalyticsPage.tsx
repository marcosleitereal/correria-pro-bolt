import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  UserPlus, 
  Dumbbell, 
  DollarSign, 
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import Skeleton from '../ui/Skeleton';

const AnalyticsPage: React.FC = () => {
  const { analytics, loading, error, formatCurrency, formatDate, refetch } = useAnalytics();

  // Cores para os gráficos
  const chartColors = [
    '#3B82F6', // blue-500
    '#8B5CF6', // violet-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#6366F1', // indigo-500
    '#EC4899', // pink-500
    '#14B8A6'  // teal-500
  ];

  const kpiCards = [
    {
      title: 'Total de Treinadores',
      value: analytics?.totalCoaches || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Novos Treinadores (Hoje)',
      value: analytics?.newCoachesToday || 0,
      icon: UserPlus,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Total de Atletas',
      value: analytics?.totalAthletes || 0,
      icon: Dumbbell,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Receita Mensal Recorrente (MRR)',
      value: analytics ? formatCurrency(analytics.monthlyRecurringRevenue) : 'R$ 0,00',
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      isMonetary: true
    }
  ];

  // Preparar dados para o gráfico de treinos
  const trainingsChartData = analytics?.trainingsLast30Days?.map(item => ({
    ...item,
    dateFormatted: formatDate(item.date)
  })) || [];

  // Preparar dados para o gráfico de distribuição de planos
  const planChartData = analytics?.planDistribution?.map((item, index) => ({
    ...item,
    fill: chartColors[index % chartColors.length]
  })) || [];

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <Skeleton className="h-6 w-1/2 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <Skeleton className="h-6 w-1/2 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
      >
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2 flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            Analytics da Plataforma
          </h1>
          <p className="text-lg text-slate-600">
            Métricas e insights sobre o crescimento e uso da plataforma
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={refetch}
          disabled={loading}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </motion.button>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Erro ao carregar analytics</p>
            <p className="text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100"
            >
              <div className="flex items-center gap-4">
                <div className={`${card.bgColor} p-4 rounded-xl`}>
                  <Icon className={`w-8 h-8 ${card.iconColor}`} />
                </div>
                <div>
                  <h3 className={`text-3xl font-bold text-slate-900 ${card.isMonetary ? 'text-2xl' : ''}`}>
                    {card.isMonetary ? card.value : card.value.toLocaleString('pt-BR')}
                  </h3>
                  <p className="text-sm font-medium text-slate-600">{card.title}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Treinos dos Últimos 30 Dias */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Treinos Gerados nos Últimos 30 Dias
              </h2>
              <p className="text-slate-600 text-sm">
                Total: {analytics?.totalTrainingsGenerated || 0} treinos
              </p>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trainingsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="dateFormatted" 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelFormatter={(label) => `Data: ${label}`}
                  formatter={(value) => [`${value} treinos`, 'Quantidade']}
                />
                <Bar 
                  dataKey="count" 
                  fill="url(#blueGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#1D4ED8" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Distribuição de Assinantes por Plano */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-100 p-3 rounded-lg">
              <PieChartIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Distribuição de Assinantes por Plano
              </h2>
              <p className="text-slate-600 text-sm">
                Total de assinantes ativos
              </p>
            </div>
          </div>
          
          {planChartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {planChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value, name, props) => [
                      `${value} assinantes`,
                      `${props.payload.name} (${formatCurrency(props.payload.price)}/mês)`
                    ]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color }}>
                        {value} ({entry.payload?.value} assinantes)
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <PieChartIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhum dado de assinatura disponível</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Métricas Adicionais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-8 bg-white rounded-xl p-6 shadow-lg border border-slate-100"
      >
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-green-600" />
          Resumo Executivo
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Taxa de Crescimento</h3>
            <p className="text-2xl font-bold text-slate-900">
              {analytics?.newCoachesToday || 0} novos hoje
            </p>
          </div>
          
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Média de Atletas por Treinador</h3>
            <p className="text-2xl font-bold text-slate-900">
              {analytics?.totalCoaches && analytics.totalCoaches > 0 
                ? Math.round((analytics.totalAthletes || 0) / analytics.totalCoaches)
                : 0
              }
            </p>
          </div>
          
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Última Atualização</h3>
            <p className="text-sm text-slate-700">
              {analytics?.generatedAt 
                ? new Date(analytics.generatedAt).toLocaleString('pt-BR')
                : 'Não disponível'
              }
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsPage;