import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, AlertTriangle, Users, Lock, Zap, Scale, Ban } from 'lucide-react';
import { Link } from 'react-router-dom';

// ETAPA A: Definir conteúdo em constante separada para evitar erros de escape
const acceptableUsePolicyContent = [
  {
    id: 'intro',
    title: 'Introdução',
    icon: Shield,
    text: 'Esta Política de Uso Aceitável define as regras e diretrizes para o uso adequado da plataforma Correria.Pro. Ao utilizar nossos serviços, você concorda em seguir estas diretrizes para manter um ambiente seguro e produtivo para todos os usuários.',
    details: [
      'Estas regras se aplicam a todos os usuários da plataforma',
      'O descumprimento pode resultar em suspensão ou encerramento da conta',
      'As regras são atualizadas periodicamente conforme necessário',
      'Casos especiais são analisados individualmente pela nossa equipe'
    ]
  },
  {
    id: 'prohibited-conduct',
    title: 'Condutas Proibidas',
    icon: Ban,
    text: 'As seguintes atividades são estritamente proibidas na plataforma Correria.Pro e podem resultar em ação disciplinar imediata.',
    details: [
      'Uso para fins ilegais ou não autorizados conforme a legislação brasileira',
      'Tentativas de acesso não autorizado a dados de outros usuários',
      'Engenharia reversa, descompilação ou tentativas de extrair nossos algoritmos',
      'Sobrecarga intencional dos nossos servidores através de uso automatizado excessivo',
      'Inserção de dados falsos, maliciosos ou que violem direitos de terceiros',
      'Compartilhamento de credenciais de acesso com terceiros não autorizados',
      'Uso da plataforma para spam, phishing ou outras atividades maliciosas'
    ]
  },
  {
    id: 'data-integrity',
    title: 'Integridade dos Dados',
    icon: Lock,
    text: 'A qualidade e veracidade dos dados inseridos na plataforma são fundamentais para o funcionamento adequado dos algoritmos de IA e para a segurança de todos os usuários.',
    details: [
      'Insira apenas dados reais e precisos sobre seus atletas',
      'Mantenha as informações de saúde e condicionamento físico atualizadas',
      'Não insira dados de terceiros sem autorização expressa',
      'Respeite a privacidade e confidencialidade dos dados dos seus atletas',
      'Reporte imediatamente qualquer suspeita de violação de dados',
      'Use apenas informações que você tem direito legal de processar'
    ]
  },
  {
    id: 'professional-responsibility',
    title: 'Responsabilidade Profissional',
    icon: Users,
    text: 'Como treinador profissional, você tem responsabilidades específicas no uso da plataforma e na aplicação dos treinos gerados pela IA.',
    details: [
      'Sempre revise e aprove os treinos gerados pela IA antes de aplicá-los',
      'Adapte os treinos conforme as necessidades individuais de cada atleta',
      'Mantenha sua certificação e conhecimento profissional atualizados',
      'Não use a plataforma como substituto para avaliação médica profissional',
      'Monitore constantemente a resposta dos atletas aos treinos aplicados',
      'Interrompa imediatamente qualquer treino que cause desconforto ou lesão'
    ]
  },
  {
    id: 'system-security',
    title: 'Segurança do Sistema',
    icon: Zap,
    text: 'A segurança da plataforma depende da colaboração de todos os usuários. Certas atividades podem comprometer a estabilidade e segurança do sistema.',
    details: [
      'Não tente contornar medidas de segurança ou autenticação',
      'Reporte vulnerabilidades de segurança imediatamente à nossa equipe',
      'Use senhas fortes e ative autenticação de dois fatores quando disponível',
      'Não compartilhe links de acesso ou tokens de autenticação',
      'Mantenha seu navegador e dispositivos atualizados com patches de segurança',
      'Faça logout adequadamente ao usar dispositivos compartilhados'
    ]
  },
  {
    id: 'content-guidelines',
    title: 'Diretrizes de Conteúdo',
    icon: AlertTriangle,
    text: 'Todo conteúdo criado, compartilhado ou armazenado na plataforma deve seguir padrões éticos e legais apropriados.',
    details: [
      'Não publique conteúdo ofensivo, discriminatório ou inadequado',
      'Respeite direitos autorais e propriedade intelectual de terceiros',
      'Não use a plataforma para promover produtos ou serviços não relacionados',
      'Mantenha comunicações profissionais e respeitosas',
      'Não compartilhe informações confidenciais de outros usuários',
      'Evite linguagem inadequada em observações e comentários de treinos'
    ]
  },
  {
    id: 'enforcement',
    title: 'Aplicação e Consequências',
    icon: Scale,
    text: 'O descumprimento desta política pode resultar em várias medidas disciplinares, dependendo da gravidade e frequência das violações.',
    details: [
      'Advertência formal: Para violações menores ou primeira ocorrência',
      'Suspensão temporária: Para violações moderadas ou reincidência',
      'Encerramento de conta: Para violações graves ou múltiplas reincidências',
      'Ação legal: Para atividades ilegais ou que causem danos significativos',
      'Processo de apelação: Disponível para contestar decisões disciplinares',
      'Reabilitação: Possível após correção de comportamentos inadequados'
    ]
  }
];

const AcceptableUsePolicyPage: React.FC = () => {
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
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Política de Uso Aceitável
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Diretrizes e regras para o uso adequado e responsável da plataforma Correria.Pro.
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
              {acceptableUsePolicyContent.map((section, index) => {
                const Icon = section.icon;
                return (
                  <section key={section.id}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-purple-600" />
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

              {/* Reporting Section */}
              <section className="border-t border-slate-200 pt-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Reportar Violações</h2>
                <div className="bg-purple-50 rounded-lg p-6">
                  <p className="text-purple-800 leading-relaxed mb-4">
                    <strong>Viu algo inadequado?</strong> Reporte violações desta política:
                  </p>
                  <div className="space-y-2 text-purple-700">
                    <p><strong>Email:</strong> compliance@correria.pro</p>
                    <p><strong>Telefone:</strong> (11) 9999-9999</p>
                    <p><strong>Formulário:</strong> Disponível no painel de controle</p>
                    <p><strong>Tempo de Resposta:</strong> Até 48 horas para análise inicial</p>
                  </div>
                  <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                    <p className="text-purple-800 text-sm">
                      <strong>Confidencialidade:</strong> Todos os reports são tratados com confidencialidade. 
                      Investigações são conduzidas de forma imparcial e profissional.
                    </p>
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
                  to="/politica-de-cookies"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Política de Cookies
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AcceptableUsePolicyPage;