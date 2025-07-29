import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

const OfflineBanner: React.FC = () => {
  const { isOnline } = usePWA();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white py-2 px-4"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <WifiOff className="w-4 h-4" />
            <span>Você está offline. Algumas funcionalidades podem estar limitadas.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;