import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useAppSettings } from '../hooks/useAppSettings';

const CTASection: React.FC = () => {
  const { user } = useAuthContext();
  const { loading: appSettingsLoading, getTrialDuration } = useAppSettings();

  return (
    <section className="py-20 px-4 bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-12 h-12 text-white" />
            </motion.div>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto para revolucionar sua gestão?
          </h2>
          
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Junte-se a mais de 10.000 treinadores que já transformaram seus resultados com a Correria.Pro
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              to={user ? '/dashboard' : '/signup'}
              className="bg-white text-blue-600 px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 flex items-center gap-3 group"
            >
              {user ? 'Ir para Dashboard' : 'Começar Agora - Grátis'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            
            <p className="text-blue-100 text-sm">
              ✓ Teste grátis por {getTrialDuration()} dias • ✓ Sem compromisso • ✓ Suporte completo
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;