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
  const { isTrialing, daysUntilTrialEnd } = useSubscriptionStatus();
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
              {/* Trial Countdown Badge */}
              {isTrialing && daysUntilTrialEnd !== null && daysUntilTrialEnd > 0 && (
                <div className="absolute -top-1 -left-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg animate-pulse">
                  {daysUntilTrialEnd}d
                </div>
              )}
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

          {/* Trial Counter - POSICIONAMENTO CORRETO */}
          {isTrialing && daysUntilTrialEnd !== null && daysUntilTrialEnd > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 animate-pulse mr-4"
            >
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Trial: {daysUntilTrialEnd} {daysUntilTrialEnd === 1 ? 'dia' : 'dias'}</span>
            </motion.div>
          )}

          {/* User menu */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative" data-notification-dropdown>
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

            {/* User Menu */}
            <div className="relative" data-user-menu>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors relative"
              >
                {getUserAvatar()}
                {/* Trial Countdown Badge for Header */}
                {isTrialing && daysUntilTrialEnd !== null && daysUntilTrialEnd > 0 && (
                  <div className="absolute -top-1 -left-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg animate-pulse">
                    {daysUntilTrialEnd}d
                  </div>
                )}
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
    </div>
  );
};

export default PrivateLayout;