import React, { useState } from 'react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, Settings, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import PWAInstallButton from './PWAInstallButton';
import PWAInstallButton from './PWAComponents/PWAInstallButton';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuthContext();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  const isLandingPage = location.pathname === '/';

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Correria.Pro
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isLandingPage && (
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-700 hover:text-blue-600 transition-colors">
                Recursos
              </a>
              <a href="#testimonials" className="text-slate-700 hover:text-blue-600 transition-colors">
                Depoimentos
              </a>
              <Link to="/pricing" className="text-slate-700 hover:text-blue-600 transition-colors">
                Preços
              </Link>
            </div>
          )}

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <PWAInstallButton variant="secondary" size="sm" />
            
            <PWAInstallButton variant="secondary" size="sm" />
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-slate-700 hover:text-blue-600 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                </button>

                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2"
                  >
                    <Link
                      to="/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Entrar
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:scale-105 transition-transform duration-300"
                >
                  Começar Grátis
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-slate-700 hover:text-blue-600 transition-colors"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-200 py-4"
          >
            <div className="space-y-4">
              {isLandingPage && (
                <>
                  <a href="#features" className="block text-slate-700 hover:text-blue-600 transition-colors">
                    Recursos
                  </a>
                  <a href="#testimonials" className="block text-slate-700 hover:text-blue-600 transition-colors">
                    Depoimentos
                  </a>
                  <Link to="/pricing" className="block text-slate-700 hover:text-blue-600 transition-colors">
                    Preços
                  </Link>
                </>
              )}
              
              {user ? (
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <p className="text-sm text-slate-600">
                    Olá, {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </p>
                  <Link
                    to="/dashboard"
                    className="block text-slate-700 hover:text-blue-600 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setShowMobileMenu(false);
                    }}
                    className="block text-slate-700 hover:text-blue-600 transition-colors"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <Link
                    to="/login"
                    className="block w-full text-left text-slate-700 hover:text-blue-600 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/signup"
                    className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold text-center"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Começar Grátis
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;