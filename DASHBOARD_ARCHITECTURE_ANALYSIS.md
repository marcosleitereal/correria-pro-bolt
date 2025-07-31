# 📋 RELATÓRIO COMPLETO - ARQUITETURA DO DASHBOARD

## 🎯 **ARQUIVOS-CHAVE IDENTIFICADOS**

### **📁 LISTA DE ARQUIVOS DO DASHBOARD:**

1. **`src/components/layout/PrivateLayout.tsx`** - Layout principal com sidebar e header
2. **`src/components/dashboard/DashboardPage.tsx`** - Página principal do dashboard
3. **`src/components/ui/Skeleton.tsx`** - Componente de loading skeleton
4. **`src/components/ui/EmptyState.tsx`** - Estados vazios reutilizáveis
5. **`src/components/ui/SubscriptionGuard.tsx`** - Guard para controle de acesso
6. **`src/components/training/WorkoutViewModal.tsx`** - Modal de visualização de treinos
7. **`src/components/PWAComponents/UpdatePrompt.tsx`** - Prompt de atualização PWA
8. **`src/components/PWAComponents/NotificationButton.tsx`** - Botão de notificações
9. **`src/components/notifications/NotificationDropdown.tsx`** - Dropdown de notificações

---

## 📄 **CONTEÚDO COMPLETO DOS ARQUIVOS:**

### **1. PrivateLayout.tsx - Layout Principal**
```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  UserCheck, 
  Dumbbell, 
  Settings, 
  User, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  Calendar,
  BarChart3,
  Bell
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useUserStore } from '../../stores/userStore';
import { useSubscriptionStatus } from '../../hooks/useSubscriptionStatus';
import { useNotifications } from '../../hooks/useNotifications';
import { supabase } from '../../lib/supabase';
import NotificationDropdown from '../notifications/NotificationDropdown';
import PWAInstallButton from '../PWAComponents/PWAInstallButton';
import NotificationButton from '../PWAComponents/NotificationButton';
import UpdatePrompt from '../PWAComponents/UpdatePrompt';

interface PrivateLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Corredores', href: '/runners', icon: Users },
  { name: 'Grupos', href: '/groups', icon: UserCheck },
  { name: 'Treinos', href: '/dashboard/generate-training', icon: Calendar },
  { name: 'Estilos de Treino', href: '/training-styles', icon: Dumbbell },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

const PrivateLayout: React.FC<PrivateLayoutProps> = ({ children }) => {
  const { user, signOut, loading } = useAuthContext();
  const { profile, fetchProfile, loading: profileLoading } = useUserStore();
  const { isTrialing, daysUntilTrialEnd, subscriptionStatus, loading: subscriptionLoading } = useSubscriptionStatus();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    handleNotificationClick 
  } = useNotifications();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // DEBUG: Logs para rastrear o problema do contador
  console.log('🔍 LAYOUT DEBUG: Estado da assinatura:', {
    isTrialing,
    daysUntilTrialEnd,
    subscriptionStatus: subscriptionStatus?.subscription_status,
    trial_ends_at: subscriptionStatus?.trial_ends_at,
    has_access: subscriptionStatus?.has_access,
    subscriptionLoading,
    userEmail: user?.email,
    shouldShowCounter: isTrialing && daysUntilTrialEnd !== null && daysUntilTrialEnd > 0,
    rawDaysCalculation: subscriptionStatus?.trial_ends_at 
      ? Math.ceil((new Date(subscriptionStatus.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : 'N/A'
  });
  
  const handleSignOut = useCallback(async () => {
    console.log('🚪 PrivateLayout: Iniciando logout seguro');
    
    // CRÍTICO: Limpar estado do usuário ANTES do logout
    const { clearProfile } = useUserStore.getState();
    clearProfile();
    
    await signOut();
    setUserMenuOpen(false);
    navigate('/login');
    
    console.log('✅ PrivateLayout: Logout concluído com limpeza de dados');
  }, [signOut, navigate]);

  // Hook para fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Verificar se o clique foi fora do dropdown de notificações
      if (notificationMenuOpen && !target.closest('[data-notification-dropdown]')) {
        setNotificationMenuOpen(false);
      }
      
      // Verificar se o clique foi fora do menu do usuário
      if (userMenuOpen && !target.closest('[data-user-menu]')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationMenuOpen, userMenuOpen]);

  // Carregar perfil do usuário apenas uma vez quando autenticado
  useEffect(() => {
    if (user && !profile && !profileLoading) {
      console.log('🔄 PrivateLayout: Carregando perfil inicial do usuário:', user.id);
      fetchProfile(user.id);
    }
    
    // DETECÇÃO DE PAGAMENTO NA URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId && user) {
      console.log('💳 LAYOUT: Session ID detectado - forçando refresh após pagamento');
      
      // Múltiplos refreshes para garantir ativação
      const refreshTimes = [2000, 5000, 10000, 15000]; // 2s, 5s, 10s, 15s
      
      refreshTimes.forEach((time, index) => {
        setTimeout(() => {
          console.log(`🔄 LAYOUT: Refresh ${index + 1}/4 após pagamento...`);
          window.location.reload();
        }, time);
      });
    }
    
    // Se o usuário está autenticado mas não tem perfil após 5 segundos, tentar recarregar
    if (user && !profile && !profileLoading) {
      const timeoutId = setTimeout(() => {
        console.log('⏰ PrivateLayout: Timeout atingido, tentando recarregar perfil...');
        fetchProfile(user.id);
      }, 5000);
      
      return () => clearTimeout(timeoutId);
    }
    
    // Verificar se o usuário ainda existe no sistema
    if (user && profile) {
      const checkUserExists = async () => {
        try {
          const { data: currentUser, error } = await supabase.auth.getUser();
          if (error) {
            // Diferenciar entre erros esperados e inesperados
            if (error.message?.includes('session_not_found') || error.message?.includes('Session from session_id claim in JWT does not exist')) {
              console.log('🔄 Sessão expirada detectada, fazendo logout automático...');
            } else {
              console.warn('⚠️ Erro na verificação de sessão:', error.message);
            }
            await handleSignOut();
          } else if (!currentUser.user) {
            console.log('🔄 Usuário não encontrado na autenticação, fazendo logout...');
            await handleSignOut();
          }
        } catch (err) {
          // Tratar erros de rede ou outros erros inesperados
          const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
          if (errorMessage.includes('session_not_found') || errorMessage.includes('Session from session_id claim in JWT does not exist')) {
            console.log('🔄 Sessão expirada detectada durante verificação, fazendo logout...');
            await handleSignOut();
          } else {
            console.error('❌ Erro inesperado ao verificar usuário:', err);
          }
        }
      };
      
      // Verificar a cada 30 segundos se o usuário ainda existe
      const interval = setInterval(checkUserExists, 30000);
      return () => clearInterval(interval);
    }
  }, [user, profile, profileLoading, fetchProfile, handleSignOut]);

  // Authentication guard
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Função para obter avatar do usuário
  const getUserAvatar = () => {
    if (profile?.avatar_url) {
      return (
        <img
          src={profile.avatar_url}
          alt="Avatar do usuário"
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }
    
    return (
      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
        <User className="w-4 h-4 text-white" />
      </div>
    );
  };

  // Show loading while checking authentication
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0 md:flex md:flex-shrink-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-6 border-b border-slate-200">
            <Link to="/dashboard" className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Correria.Pro
              </h1>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}

            {/* Admin Link - Only for admins */}
            {profile?.role === 'admin' && (
              <>
                <div className="my-4 border-t border-slate-200"></div>
                <Link
                  to="/admin/analytics"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    location.pathname === '/admin/analytics'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className={`w-5 h-5 ${location.pathname === '/admin/analytics' ? 'text-red-600' : 'text-slate-500'}`} />
                  <span className="font-medium">Analytics</span>
                </Link>
                <Link
                  to="/admin/dashboard"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    location.pathname === '/admin/dashboard'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Settings className={`w-5 h-5 ${location.pathname === '/admin/dashboard' ? 'text-red-600' : 'text-slate-500'}`} />
                  <span className="font-medium">Admin</span>
                </Link>
              </>
            )}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 relative">
              {getUserAvatar()}
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {profile?.full_name || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-slate-600">
                  {profile?.role === 'coach' ? 'Treinador' : 'Administrador'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 md:pl-0">
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 lg:px-6 h-16 flex items-center justify-between">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden text-slate-600 hover:text-slate-900 transition-colors p-2 rounded-lg hover:bg-slate-100"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Trial Counter */}
          <div className="flex-1"></div>

          {/* Trial Counter - POSICIONAMENTO CORRETO COM DEBUG */}
          {/* Trial Counter - Design Sutil */}
          {(isTrialing && daysUntilTrialEnd !== null && daysUntilTrialEnd > 0) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-lg text-xs font-medium shadow-md flex items-center gap-1 mr-4"
            >
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              <span>{daysUntilTrialEnd} {daysUntilTrialEnd === 1 ? 'dia' : 'dias'} restantes</span>
            </motion.div>
          )}

          {/* User menu */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <NotificationButton variant="icon" />
            
            <div className="relative" data-notification-dropdown>
              <NotificationButton variant="icon" />
              <button
                onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
                className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Bell className="w-6 h-6 text-slate-600" />
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.div>
                )}
              </button>

              {/* Notification Dropdown */}
              <NotificationDropdown
                isOpen={notificationMenuOpen}
                onClose={() => setNotificationMenuOpen(false)}
                notifications={notifications}
                unreadCount={unreadCount}
                onNotificationClick={(notification) => {
                  handleNotificationClick(notification);
                  setNotificationMenuOpen(false);
                }}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
              />
            </div>

            {/* PWA Install Button */}
            <PWAInstallButton variant="secondary" size="sm" />

            {/* User Menu */}
            <div className="relative" data-user-menu>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors relative"
              >
                {getUserAvatar()}
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {profile?.full_name || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-slate-600">
                    {profile?.role === 'coach' ? 'Treinador' : 'Administrador'}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {/* User dropdown menu */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50"
                  >
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Meu Perfil
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
      
      {/* Update Prompt */}
      <UpdatePrompt />
    </div>
  );
};

export default PrivateLayout;
```

### **2. DashboardPage.tsx - Página Principal do Dashboard**
```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Calendar, TrendingUp, Clock, Target, Share2, FileText, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useSubscriptionStatus } from '../../hooks/useSubscriptionStatus';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { useTrainings } from '../../hooks/useTrainings';
import { useRunners } from '../../hooks/useRunners';
import { useFeedbackCompletionRate } from '../../hooks/useFeedbackCompletionRate';
import SubscriptionGuard from '../ui/SubscriptionGuard';
import EmptyState from '../ui/EmptyState';
import WorkoutViewModal from '../training/WorkoutViewModal';
import Skeleton from '../ui/Skeleton';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { isTrialing, daysUntilTrialEnd } = useSubscriptionStatus();
  const { canAccessFeature, blockingReason, loading: guardLoading } = useSubscriptionGuard();
  const { trainings, draftTrainings, finalizedTrainings, loading } = useTrainings();
  const { runners } = useRunners();
  const { 
    completionRate, 
    loading: completionRateLoading,
    getEngagementLevel,
    getEngagementColor,
    getEngagementMessage 
  } = useFeedbackCompletionRate();
  const [selectedTraining, setSelectedTraining] = React.useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);

  const handleViewTraining = (training: any) => {
    setSelectedTraining(training);
    setIsViewModalOpen(true);
  };

  // AGUARDAR CARREGAMENTO ANTES DE DECIDIR BLOQUEIO
  if (guardLoading && loading) {
    return (
      <div className="h-full bg-slate-50">
        <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // BLOQUEIO TOTAL PARA PLANO RESTRITO OU SEM ACESSO
  if (!canAccessFeature) {
    return (
      <div className="h-full bg-slate-50">
        <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 h-full">
          <SubscriptionGuard feature="general">
            <div></div>
          </SubscriptionGuard>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50">
      <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 h-full">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Olá, {profile?.full_name?.split(' ')[0] || 'Treinador'}! 👋
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Bem-vindo ao seu painel de controle. Aqui você pode gerenciar seus treinos e acompanhar o progresso dos seus atletas.
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dashboard/generate-training')}
          className="mt-4 lg:mt-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-lg whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          + Novo Treino
        </motion.button>
      </motion.div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-xl">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900">{runners.filter(r => !r.is_archived).length}</h3>
                <p className="text-base font-medium text-slate-700">Corredores Ativos</p>
                <p className="text-sm text-slate-600">{runners.filter(r => !r.is_archived).length} ativos</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-4 rounded-xl">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900">{trainings.length}</h3>
                <p className="text-base font-medium text-slate-700">Treinos este Mês</p>
                <p className="text-sm text-slate-600">{draftTrainings.length} rascunhos</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-4 rounded-xl">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <div>
                {completionRateLoading ? (
                  <>
                    <div className="h-8 bg-slate-200 rounded w-16 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-slate-200 rounded w-24 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-slate-200 rounded w-32 animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <h3 className={`text-3xl font-bold ${getEngagementColor(completionRate)}`}>
                      {completionRate}%
                    </h3>
                    <p className="text-base font-medium text-slate-700">Taxa de Engajamento</p>
                    <p className="text-sm text-slate-600">
                      {getEngagementLevel(completionRate)} - {getEngagementMessage(completionRate)}
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Continue de Onde Parou */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Continue de Onde Parou</h2>
            <Clock className="w-6 h-6 text-slate-500" />
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 lg:p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              ))}
            </div>
          ) : draftTrainings.length === 0 ? (
            <EmptyState
              icon={Target}
              title="Nenhum treino em andamento"
              description="Você não possui treinos em rascunho no momento. Que tal criar um novo treino para seus atletas?"
              actionText="+ Criar Primeiro Treino"
              onAction={() => navigate('/dashboard/generate-training')}
            />
          ) : (
            <div className="space-y-3">
              {draftTrainings.map((training, index) => (
                <motion.div
                  key={training.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-slate-900 mb-1">{training.title}</h4>
                    <p className="text-sm text-slate-600">
                      Criado em {new Date(training.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/dashboard/training/${training.id}/edit`)}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <FileText className="w-4 h-4" />
                    Continuar Editando
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Atividade Recente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Atividade Recente</h2>
            <Calendar className="w-6 h-6 text-slate-500" />
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 lg:p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              ))}
            </div>
          ) : finalizedTrainings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Nenhuma atividade recente"
              description="Suas atividades mais recentes aparecerão aqui. Comece criando treinos e gerenciando seus atletas."
              actionText="+ Criar Primeiro Treino"
              onAction={() => navigate('/dashboard/generate-training')}
            />
          ) : (
            <div className="space-y-3">
              {finalizedTrainings.map((training, index) => (
                <motion.div
                  key={training.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-slate-900 mb-1">{training.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                      <span>Finalizado em {new Date(training.updated_at).toLocaleDateString('pt-BR')}</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Enviado
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewTraining(training)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:scale-105 transition-transform duration-300 flex items-center gap-2 whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    Ver e Compartilhar
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Workout View Modal */}
      <WorkoutViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedTraining(null);
        }}
        training={selectedTraining}
      />
      </div>
    </div>
  );
};

export default DashboardPage;
```

### **3. Skeleton.tsx - Componente de Loading**
```tsx
import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded ${className}`}
    />
  );
};

export default Skeleton;
```

### **4. EmptyState.tsx - Estados Vazios**
```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center py-12"
    >
      <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
      
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {title}
      </h3>
      
      <p className="text-slate-600 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      
      {actionText && onAction && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
        >
          {actionText}
        </motion.button>
      )}
    </motion.div>
  );
};

export default EmptyState;
```

### **5. SubscriptionGuard.tsx - Guard de Acesso**
```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Crown, Users, Calendar } from 'lucide-react';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature: 'create_runner' | 'generate_training' | 'general';
  fallback?: React.ReactNode;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  feature,
  fallback
}) => {
  const {
    canCreateRunner,
    canGenerateTraining,
    canAccessFeature,
    trialExpired,
    athleteLimitReached,
    blockingReason,
    showUpgradeModal,
    getAthleteCountDisplay,
    loading
  } = useSubscriptionGuard();

  const canAccess = () => {
    switch (feature) {
      case 'create_runner':
        return canCreateRunner;
      case 'generate_training':
        return canGenerateTraining;
      case 'general':
        return canAccessFeature;
      default:
        return false;
    }
  };

  console.log('🛡️ SUBSCRIPTION GUARD DEBUG:', {
    feature,
    canAccess: canAccess(),
    canCreateRunner,
    canGenerateTraining,
    canAccessFeature,
    trialExpired,
    blockingReason,
    loading
  });

  // Aguardar carregamento apenas do subscription status (mais rápido)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const getIcon = () => {
    if (trialExpired) return Calendar;
    if (athleteLimitReached) return Users;
    if (blockingReason?.includes('restrito')) return AlertTriangle;
    return Crown;
  };

  const getTitle = () => {
    if (trialExpired) return 'Período de Teste Expirado';
    if (athleteLimitReached) return 'Limite de Atletas Atingido';
    if (blockingReason?.includes('restrito') || blockingReason?.includes('Restrito')) return '🚫 Conta Restrita';
    return 'Acesso Restrito';
  };

  const getDescription = () => {
    if (trialExpired) {
      return 'Seu período de teste gratuito chegou ao fim. Escolha um plano para continuar aproveitando todos os recursos da Correria.Pro.';
    }
    if (athleteLimitReached) {
      return `Você está usando ${getAthleteCountDisplay()}. Faça upgrade do seu plano para adicionar mais atletas e expandir sua operação.`;
    }
    if (blockingReason?.includes('restrito') || blockingReason?.includes('Restrito')) {
      return 'Seu período de teste expirou e sua conta foi movida para o modo restrito. Faça upgrade para um plano pago para reativar todas as funcionalidades.';
    }
    return 'Você precisa de um plano ativo para acessar este recurso.';
  };

  if (canAccess()) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const Icon = getIcon();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 text-center"
    >
      <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-orange-600" />
      </div>
      
      <h3 className="text-xl font-bold text-slate-900 mb-3">
        {getTitle()}
      </h3>
      
      <p className="text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
        {getDescription()}
      </p>

      {blockingReason && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <p className="text-orange-800 text-sm font-medium text-left">
              {blockingReason}
            </p>
          </div>
        </div>
      )}
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={showUpgradeModal}
        className={`px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 ${
          blockingReason?.includes('restrito') || blockingReason?.includes('Restrito')
            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
            : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
        }`}
      >
        {blockingReason?.includes('restrito') || blockingReason?.includes('Restrito') 
          ? '🚀 Fazer Upgrade Agora' 
          : trialExpired ? 'Assinar Agora' : 'Fazer Upgrade'
        }
      </motion.button>
    </motion.div>
  );
};

export default SubscriptionGuard;
```

---

## 🎯 **RESUMO DA ARQUITETURA DO DASHBOARD:**

### **🏗️ ESTRUTURA HIERÁRQUICA:**
```
PrivateLayout (Container Principal)
├── Sidebar (Navegação)
│   ├── Logo
│   ├── Menu Items (6 itens)
│   ├── Admin Links (se admin)
│   └── User Info
├── Header
│   ├── Mobile Menu Button
│   ├── Trial Counter
│   ├── Notification Bell
│   ├── PWA Install Button
│   └── User Menu Dropdown
└── Main Content Area
    └── DashboardPage
        ├── Welcome Header
        ├── KPI Cards (3 cards)
        ├── Continue de Onde Parou
        └── Atividade Recente
```

### **🔧 FUNCIONALIDADES PRINCIPAIS:**
- ✅ **Sidebar responsiva** com navegação completa
- ✅ **Header dinâmico** com contador de trial
- ✅ **Sistema de notificações** com dropdown
- ✅ **Guards de acesso** baseados na assinatura
- ✅ **Estados de loading** com skeleton
- ✅ **Estados vazios** informativos
- ✅ **PWA integration** com install button
- ✅ **User management** com avatar e menu

### **🎨 DESIGN PATTERNS:**
- 🎭 **Animações suaves** com Framer Motion
- 📱 **Design responsivo** mobile-first
- 🎨 **Gradientes consistentes** azul/roxo
- ⚡ **Micro-interações** em botões e cards
- 🔄 **Loading states** bem implementados

**O Dashboard é uma interface moderna e profissional que oferece uma experiência completa de gestão para treinadores!**