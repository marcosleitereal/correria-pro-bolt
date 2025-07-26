import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Cookie, Settings, Eye, Shield, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

// ETAPA A: Definir conteúdo em constante separada para evitar erros de escape
const cookiePolicyContent = [
  {
    id: 'intro',
    title: 'O que são Cookies?',
    icon: Cookie,
    text: 'Cookies são pequenos arquivos de texto que os sites colocam no seu dispositivo (computador, tablet ou celular) enquanto você navega. Eles são amplamente utilizados para fazer os sites funcionarem de forma mais eficiente, bem como para fornecer informações aos proprietários do site sobre como os usuários interagem com suas páginas.',
    details: [
      'Os cookies não podem executar programas ou entregar vírus para seu computador',
      'Eles são únicos para seu navegador e contêm apenas informações anônimas',
      'Não coletamos informações pessoais através de cookies sem seu consentimento'
    ]
  },
  {
    id: 'types',
    title: 'Tipos de Cookies que Utilizamos',
    icon: Settings,
    text: 'A Correria.Pro utiliza diferentes tipos de cookies para garantir o melhor funcionamento da plataforma e melhorar sua experiência de uso.',
    details: [
      'Cookies Essenciais: Necessários para o funcionamento básico do site (login, navegação)',
      'Cookies de Performance: Nos ajudam a entender como você usa o site (Google Analytics)',
      'Cookies de Funcionalidade: Lembram suas preferências e configurações',
      'Cookies de Segurança: Protegem contra ataques e garantem a segurança da sua sessão'
    ]
  },
  {
    id: 'usage',
    title: 'Como Usamos os Cookies',
    icon: Eye,
    text: 'Utilizamos cookies para diversas finalidades legítimas que melhoram sua experiência na plataforma Correria.Pro.',
    details: [
      'Manter você logado durante sua sessão de uso',
      'Lembrar suas preferências de idioma e configurações',
      'Analisar o tráfego do site para melhorar nossos serviços',
      'Personalizar conteúdo e funcionalidades baseadas no seu uso',
      'Garantir a segurança da plataforma contra ataques maliciosos',
      'Fornecer suporte técnico mais eficiente'
    ]
  },
  {
    id: 'control',
    title: 'Como Controlar os Cookies',
    icon: Shield,
    text: 'Você tem controle total sobre os cookies em seu navegador e pode gerenciá-los conforme suas preferências.',
    details: [
      'A maioria dos navegadores aceita cookies automaticamente, mas você pode modificar essas configurações',
      'Você pode bloquear todos os cookies ou receber um aviso antes que um cookie seja armazenado',
      'Pode deletar cookies já armazenados a qualquer momento através das configurações do navegador',
      'Lembre-se: desabilitar cookies pode afetar a funcionalidade de alguns recursos da plataforma'
    ]
  },
  {
    id: 'browser-settings',
    title: 'Configurações por Navegador',
    icon: Settings,
    text: 'Cada navegador tem suas próprias configurações para gerenciar cookies. Aqui estão os links diretos para as principais opções.',
    details: [
      'Google Chrome: Menu > Configurações > Privacidade e segurança > Cookies',
      'Mozilla Firefox: Menu > Opções > Privacidade e Segurança > Cookies',
      'Safari: Preferências > Privacidade > Gerenciar dados do site',
      'Microsoft Edge: Menu > Configurações > Cookies e permissões do site'
    ]
  },
  {
    id: 'updates',
    title: 'Atualizações desta Política',
    icon: Info,
    text: 'Esta Política de Cookies pode ser atualizada periodicamente para refletir mudanças em nossas práticas ou na legislação aplicável.',
    details: [
      'Notificaremos sobre alterações significativas através de email',
      'Publicaremos um aviso destacado na plataforma',
      'Atualizaremos a data de última modificação no topo desta página',
      'Recomendamos que você revise esta política regularmente'
    ]
  }
];

const CookiePolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 text-blue-600" />
            <span className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Voltar ao início
            </span>
          </Link>
          
          <Link to="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Correria.Pro
            </h1>
          </Link>
          
          <div className="w-24"></div>
        </div>
      </nav>

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="bg-gradient-to-r from-orange-500 to-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Cookie className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Política de Cookies
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Entenda como utilizamos cookies para melhorar sua experiência na plataforma Correria.Pro.
            </p>
            <div className="mt-6 text-sm text-slate-500">
              <p>Última atualização: 26 de janeiro de 2025</p>
              <p>Versão: 1.0</p>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden"
          >
            <div className="p-8 space-y-8">
              {/* ETAPA B: Renderizar conteúdo mapeando sobre a constante */}
              {cookiePolicyContent.map((section, index) => {
                const Icon = section.icon;
                return (
                  <section key={section.id}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-orange-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">{index + 1}. {section.title}</h2>
                    </div>
                    <div className="prose prose-slate max-w-none">
                      <p className="text-slate-700 leading-relaxed mb-4">
                        {section.text}
                      </p>
                      {section.details && (
                        <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                          {section.details.map((detail, detailIndex) => (
                            <li key={detailIndex}>{detail}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>
                );
              })}

              {/* Contact Section */}
              <section className="border-t border-slate-200 pt-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Contato</h2>
                <div className="bg-slate-50 rounded-lg p-6">
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Para dúvidas sobre esta Política de Cookies, entre em contato conosco:
                  </p>
                  <div className="space-y-2 text-slate-700">
                    <p><strong>Email:</strong> cookies@correria.pro</p>
                    <p><strong>Telefone:</strong> (11) 9999-9999</p>
                    <p><strong>Endereço:</strong> São Paulo, SP - Brasil</p>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>

          {/* Related Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 text-center"
          >
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Documentos Relacionados</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/termos-de-uso"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Termos de Uso
                </Link>
                <span className="text-slate-300">•</span>
                <Link
                  to="/politica-de-privacidade"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Política de Privacidade
                </Link>
                <span className="text-slate-300">•</span>
                <Link
                  to="/politica-de-uso-aceitavel"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Política de Uso Aceitável
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyPage;