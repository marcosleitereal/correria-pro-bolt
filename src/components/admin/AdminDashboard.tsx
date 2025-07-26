import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Brain, Key, Shield, AlertTriangle, CreditCard } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../ui/Accordion';
import AIProviderManagement from './AIProviderManagement';
import AICustomization from './AICustomization';
import BillingManagement from './BillingManagement';
import SecurityManagement from './SecurityManagement';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ai-providers');

  const tabs = [
    {
      id: 'ai-providers',
      label: 'Provedores IA',
      fullLabel: 'Gestão de Provedores de IA',
      icon: Brain,
      component: AIProviderManagement
    },
    {
      id: 'ai-customization',
      label: 'Customização',
      fullLabel: 'Customização da IA',
      icon: Settings,
      component: AICustomization
    },
    {
      id: 'billing',
      label: 'Faturamento',
      fullLabel: 'Faturamento',
      icon: CreditCard,
      component: BillingManagement
    },
    {
      id: 'security',
      label: 'Segurança',
      fullLabel: 'Segurança',
      icon: Shield,
      component: SecurityManagement
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component || (() => null);

  return (
    <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden w-full">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 w-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-3 rounded-lg">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
              Painel Administrativo
            </h1>
            <p className="text-base sm:text-lg text-slate-600">
              Gerencie configurações globais da plataforma
            </p>
          </div>
        </div>

        {/* Security Warning */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Área Restrita</p>
            <p className="text-red-700 text-xs sm:text-sm">
              Apenas administradores têm acesso a estas configurações. Todas as ações são registradas.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Mobile Accordion Layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="block md:hidden mb-8 w-full"
      >
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="ai-providers" className="w-full">
            <AccordionTrigger value="ai-providers">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-blue-600" />
                <span>Gestão de Provedores de IA</span>
              </div>
            </AccordionTrigger>
            <AccordionContent value="ai-providers" className="w-full">
              <AIProviderManagement />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ai-customization" className="w-full">
            <AccordionTrigger value="ai-customization">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-purple-600" />
                <span>Customização da IA</span>
              </div>
            </AccordionTrigger>
            <AccordionContent value="ai-customization" className="w-full">
              <AICustomization />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="billing" className="w-full">
            <AccordionTrigger value="billing">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-green-600" />
                <span>Faturamento</span>
              </div>
            </AccordionTrigger>
            <AccordionContent value="billing" className="w-full">
              <BillingManagement />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="security" className="w-full">
            <AccordionTrigger value="security">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-red-600" />
                <span>Segurança</span>
              </div>
            </AccordionTrigger>
            <AccordionContent value="security" className="w-full">
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Funcionalidade em desenvolvimento</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </motion.div>

      {/* Desktop Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="hidden md:block bg-white rounded-xl shadow-lg border border-slate-100 mb-8 w-full overflow-hidden"
      >
        <div className="border-b border-slate-200 w-full">
          <div className="overflow-x-auto">
            <nav className="flex whitespace-nowrap px-4 sm:px-6 scrollbar-hide min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors flex-shrink-0 ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{tab.fullLabel}</span>
                </button>
              );
            })}
          </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 w-full">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <ActiveComponent />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;