import React from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

interface PWAInstallButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  const { canInstall, installApp, isInstalled } = usePWA();

  const handleInstall = async () => {
    await installApp();
  };

  if (!canInstall || isInstalled) {
    return null;
  }

  const baseClasses = "font-semibold rounded-lg transition-all duration-300 flex items-center gap-2";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-105 shadow-lg hover:shadow-xl",
    secondary: "border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-100"
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <motion.button
      whileHover={{ scale: variant === 'primary' ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleInstall}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      <Download className={iconSizes[size]} />
      Instalar App
    </motion.button>
  );
};

export default PWAInstallButton;