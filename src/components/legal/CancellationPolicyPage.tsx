import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, XCircle, RefreshCw, CreditCard, Calendar, AlertTriangle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppSettings } from '../../hooks/useAppSettings';

// ETAPA A: Definir conteúdo em constante separada para evitar erros de escape
const getCancellationPolicyContent = (trialDays: number) => [
  {
    id: 'intro',
    title: 'Introdução',
    icon: XCircle,
    text: 'A Correria.Pro oferece flexibilidade total para cancelamento de assinaturas. Entendemos que suas necessidades podem mudar, e queremos tornar o processo de cancelamento o mais simples e transparente possível.',
    details: [
      'Você pode cancelar sua assinatura a qualquer momento',
      'Não há multas ou taxas de cancelamento',
      'O cancelamento pode ser feito diretamente no seu painel de controle',
      'Você continuará tendo acesso até o final do período já pago'
    ]
  },
  {
    id: 'how-to-cancel',
    title: 'Como Cancelar sua Assinatura',
    icon: RefreshCw,
    text: 'O processo de cancelamento é simples e pode ser realizado em poucos cliques através do seu painel de controle.',
    details: [
      'Faça login na sua conta Correria.Pro',
      'Acesse Configurações > Assinatura',
      'Clique em "Cancelar Assinatura"',
      'Confirme o cancelamento seguindo as instruções na tela',
      'Você receberá um email de confirmação do cancelamento'
    ]
  },
  {
    id: 'immediate-effects',
    title: 'Efeitos Imediatos do Cancelamento',
    icon: Calendar,
    text: 'Quando você cancela sua assinatura, algumas mudanças entram em vigor imediatamente, enquanto outras só se aplicam no final do período de faturamento.',
    details: [
      'Renovação automática é interrompida imediatamente',
      'Você mantém acesso completo até o final do período pago',
      'Não haverá novas cobranças após o cancelamento',
      'Seus dados permanecem seguros durante o período de acesso restante',
      'Você pode reativar a assinatura a qualquer momento antes do vencimento'
    ]
  },
  {
    id: 'refund-policy',
    title: 'Política de Reembolso',
    icon: CreditCard,
    text: 'Nossa política de reembolso é justa e transparente, considerando diferentes situações que podem justificar a devolução do valor pago.',
    details: [
      'Reembolso integral: Disponível nos primeiros 7 dias após a primeira cobrança',
      'Problemas técnicos: Reembolso proporcional se nossos serviços estiverem indisponíveis por mais de 48h consecutivas',
      'Cobrança indevida: Reembolso integral em caso de erro de cobrança',
      `Cancelamento no período de teste: Não há cobrança durante os ${trialDays} dias de teste, portanto não há necessidade de reembolso`,
      'Processamento: Reembolsos são processados em até 5-10 dias úteis'
    ]
  },
  {
    id: 'data-retention',
    title: 'Retenção de Dados Após Cancelamento',
    icon: AlertTriangle,
    text: 'Seus dados são importantes para nós. Mantemos uma política clara sobre o que acontece com suas informações após o cancelamento.',
    details: [
      'Dados mantidos por 90 dias: Período de carência para possível reativação',
      'Backup de segurança: Seus treinos e dados de atletas ficam seguros durante este período',
      'Reativação simples: Você pode reativar sua conta e recuperar todos os dados em até 90 dias',
      'Exclusão definitiva: Após 90 dias, todos os dados são permanentemente excluídos',
      'Solicitação de exclusão imediata: Disponível mediante contato com nosso suporte'
    ]
  },
  {
    id: 'reactivation',
    title: 'Reativação de Conta',
    icon: RefreshCw,
    text: 'Mudou de ideia? A reativação da sua conta Correria.Pro é simples e rápida, desde que feita dentro do período de carência.',
    details: [
      'Período disponível: Até 90 dias após o cancelamento',
      'Dados preservados: Todos os seus treinos, atletas e configurações estarão intactos',
      'Processo simples: Faça login e siga as instruções para reativar',
      'Cobrança imediata: A reativação resulta em cobrança proporcional ao período restante',
      'Suporte disponível: Nossa equipe pode ajudar no processo de reativação'
    ]
  },
  {
    id: 'special-situations',
    title: 'Situações Especiais',
    icon: Phone,
    text: 'Algumas situações podem requerer atenção especial da nossa equipe de suporte. Estamos aqui para ajudar.',
    details: [
      'Problemas de saúde: Consideramos suspensão temporária em casos documentados',
      'Dificuldades financeiras: Podemos oferecer planos de pagamento alternativos',
      'Problemas técnicos: Suporte prioritário para resolver questões antes do cancelamento',
      'Migração de dados: Ajudamos na exportação dos seus dados antes da exclusão',
      'Feedback importante: Valorizamos sua opinião sobre melhorias na plataforma'
    ]
  }
];

const CancellationPolicyPage: React.FC = () => {
  const { settings } = useAppSettings();

  // Obter duração do teste das configurações do admin
  const getTrialDuration = () => {
    if (settings?.trial_duration_days) {
      return settings.trial_duration_days;
    }
    return 30; // Fallback padrão
  };

  const cancellationPolicyContent = getCancellationPolicyContent(getTrialDuration());

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
            <div className="bg-gradient-to-r from-red-500 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Política de Cancelamento
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Processo transparente e flexível para cancelamento de assinaturas, reembolsos e reativação de conta.
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
              {cancellationPolicyContent.map((section, index) => {
                const Icon = section.icon;
                return (
                  <section key={section.id}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-red-600" />
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

              {/* Emergency Contact Section */}
              <section className="border-t border-slate-200 pt-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Contato para Cancelamento</h2>
                <div className="bg-red-50 rounded-lg p-6">
                  <p className="text-red-800 leading-relaxed mb-4">
                    <strong>Precisa de ajuda com o cancelamento?</strong> Nossa equipe está disponível para auxiliar:
                  </p>
                  <div className="space-y-2 text-red-700">
                    <p><strong>Email:</strong> cancelamento@correria.pro</p>
                    <p><strong>Telefone:</strong> (11) 9999-9999</p>
                    <p><strong>Horário:</strong> Segunda a Sexta, 9h às 18h</p>
                    <p><strong>Tempo de Resposta:</strong> Até 24 horas para solicitações de cancelamento</p>
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

export default CancellationPolicyPage;