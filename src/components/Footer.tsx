import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Correria.Pro
            </h3>
            <p className="text-slate-400 mb-4">
              A plataforma definitiva para treinadores de corrida que buscam performance extraordinária.
            </p>
          </motion.div>

          {/* Produto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold mb-4">Plataforma</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="/#features" className="hover:text-white transition-colors">Recursos</a></li>
              <li><a href="/pricing" className="hover:text-white transition-colors">Preços</a></li>
              <li><a href="/#testimonials" className="hover:text-white transition-colors">Depoimentos</a></li>
              <li><a href="/politica-de-cancelamento" className="hover:text-white transition-colors">Política de Cancelamento</a></li>
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="/termos-de-uso" className="hover:text-white transition-colors">Termos de Uso</a></li>
              <li><a href="/politica-de-privacidade" className="hover:text-white transition-colors">Política de Privacidade</a></li>
              <li><a href="/politica-de-cookies" className="hover:text-white transition-colors">Política de Cookies</a></li>
              <li><a href="/politica-de-uso-aceitavel" className="hover:text-white transition-colors">Uso Aceitável</a></li>
            </ul>
          </motion.div>

          {/* Suporte */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold mb-4">Suporte</h4>
            <div className="space-y-3 text-slate-400">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4" />
                <span>contato@correria.pro</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4" />
                <span>(11) 9999-9999</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" />
                <span>São Paulo, Brasil</span>
              </div>
              <div className="pt-2">
                <a href="/signup" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                  Criar Conta Gratuita →
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
          <p>&copy; 2024 Correria.Pro. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;