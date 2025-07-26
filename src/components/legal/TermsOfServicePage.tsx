import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Shield, Users, CreditCard, Scale, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppSettings } from '../../hooks/useAppSettings';

const TermsOfServicePage: React.FC = () => {
  const { loading: appSettingsLoading, getTrialDuration } = useAppSettings();

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
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Termos de Uso
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Estes termos regem o uso da plataforma Correria.Pro. Leia atentamente antes de utilizar nossos serviços.
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
              {/* Section 1 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">1. Aceitação dos Termos</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">
                    Ao acessar e utilizar a plataforma Correria.Pro, você concorda integralmente com estes Termos de Uso. 
                    Se você não concorda com qualquer parte destes termos, não deve utilizar nossos serviços.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    Estes termos constituem um acordo legal vinculativo entre você (usuário) e a Correria.Pro. 
                    Recomendamos que você imprima ou salve uma cópia destes termos para seus registros.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">2. Descrição do Serviço</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">
                    A Correria.Pro é uma plataforma SaaS (Software as a Service) B2B destinada exclusivamente a treinadores 
                    de corrida profissionais. Nossa plataforma oferece:
                  </p>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li>Gestão completa de atletas e corredores</li>
                    <li>Geração automática de treinos personalizados utilizando Inteligência Artificial</li>
                    <li>Dashboard analítico para acompanhamento de performance</li>
                    <li>Sistema de feedback e comunicação com atletas</li>
                    <li>Ferramentas de exportação e compartilhamento de treinos</li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed">
                    <strong>Importante:</strong> A Correria.Pro é uma ferramenta de apoio tecnológico. Os treinos gerados 
                    pela IA devem sempre ser revisados e aprovados por um profissional qualificado antes da aplicação.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">3. Contas de Usuário</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">
                    Para utilizar a Correria.Pro, você deve criar uma conta fornecendo informações precisas e atualizadas. 
                    Você é inteiramente responsável por:
                  </p>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li>Manter a confidencialidade de sua senha e credenciais de acesso</li>
                    <li>Todas as atividades que ocorrem em sua conta</li>
                    <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                    <li>Manter suas informações de contato atualizadas</li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed">
                    Você deve ser maior de 18 anos e ter capacidade legal para celebrar contratos. 
                    Contas empresariais devem ser criadas por representantes autorizados da empresa.
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <CreditCard className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">4. Planos e Pagamentos</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">
                    A Correria.Pro opera sob modelo de assinatura mensal ou anual. Os detalhes dos planos incluem:
                  </p>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li><strong>Período de Teste:</strong> {appSettingsLoading 
                      ? 'Carregando informações sobre o período de teste...' 
                      : `Oferecemos um período de teste gratuito de ${getTrialDuration()} dias conforme especificado na página de preços`}</li>
                    <li><strong>Faturamento:</strong> As cobranças são processadas automaticamente no início de cada ciclo</li>
                    <li><strong>Impostos:</strong> Preços podem não incluir impostos aplicáveis conforme sua localização</li>
                    <li><strong>Alterações de Preço:</strong> Notificaremos com 30 dias de antecedência sobre mudanças nos preços</li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed">
                    Para informações detalhadas sobre cancelamento e reembolso, consulte nossa 
                    <Link to="/politica-de-cancelamento" className="text-blue-600 hover:text-blue-700 font-medium"> Política de Cancelamento</Link>.
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <Scale className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">5. Propriedade Intelectual</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">5.1 Seus Dados</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Você mantém total propriedade sobre:
                  </p>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li>Todos os dados de atletas que você inserir na plataforma</li>
                    <li>Os treinos personalizados gerados para seus atletas</li>
                    <li>Relatórios e análises baseados em seus dados</li>
                    <li>Qualquer conteúdo original que você criar na plataforma</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-6">5.2 Nossa Propriedade</h3>
                  <p className="text-slate-700 leading-relaxed">
                    A Correria.Pro mantém propriedade exclusiva sobre:
                  </p>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li>A plataforma, software e toda sua tecnologia subjacente</li>
                    <li>Algoritmos de Inteligência Artificial e modelos de machine learning</li>
                    <li>Interface do usuário, design e experiência da plataforma</li>
                    <li>Marca, logotipos e materiais de marketing</li>
                  </ul>
                </div>
              </section>

              {/* Section 6 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">6. Política de Uso Aceitável</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">
                    Ao utilizar a Correria.Pro, você concorda em não:
                  </p>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li>Usar a plataforma para fins ilegais ou não autorizados</li>
                    <li>Tentar acessar dados de outros usuários ou comprometer a segurança</li>
                    <li>Fazer engenharia reversa ou tentar extrair nossos algoritmos</li>
                    <li>Sobrecarregar nossos servidores com uso excessivo ou automatizado</li>
                    <li>Inserir dados falsos, maliciosos ou que violem direitos de terceiros</li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed">
                    Para detalhes completos, consulte nossa 
                    <Link to="/politica-de-uso-aceitavel" className="text-blue-600 hover:text-blue-700 font-medium"> Política de Uso Aceitável</Link>.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Shield className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">7. Limitação de Responsabilidade</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 font-medium">
                      <strong>AVISO IMPORTANTE:</strong> A Correria.Pro é uma ferramenta de apoio tecnológico e não substitui 
                      o conhecimento, experiência e responsabilidade profissional do treinador.
                    </p>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    A Correria.Pro não se responsabiliza por:
                  </p>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li>Resultados específicos de performance dos atletas</li>
                    <li>Lesões ou problemas de saúde decorrentes dos treinos</li>
                    <li>Decisões tomadas com base nas sugestões da IA</li>
                    <li>Perda de dados devido a problemas técnicos (embora façamos backup regular)</li>
                    <li>Interrupções temporárias do serviço para manutenção</li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed">
                    <strong>Recomendação Profissional:</strong> Sempre consulte profissionais de saúde qualificados 
                    antes de iniciar qualquer programa de treinamento. Os treinos devem ser adaptados às condições 
                    individuais de cada atleta.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">8. Rescisão</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">8.1 Rescisão pelo Usuário</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Você pode cancelar sua conta a qualquer momento através do painel de controle ou entrando em contato conosco. 
                    Após o cancelamento:
                  </p>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li>Você manterá acesso até o final do período pago</li>
                    <li>Seus dados serão mantidos por 90 dias para possível reativação</li>
                    <li>Após 90 dias, os dados serão permanentemente excluídos</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-6">8.2 Rescisão pela Correria.Pro</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Podemos suspender ou encerrar sua conta em caso de:
                  </p>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li>Violação destes Termos de Uso</li>
                    <li>Uso inadequado ou abusivo da plataforma</li>
                    <li>Inadimplência por mais de 15 dias</li>
                    <li>Atividades que comprometam a segurança da plataforma</li>
                  </ul>
                </div>
              </section>

              {/* Section 9 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Scale className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">9. Legislação Aplicável</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">
                    Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. 
                    Qualquer disputa decorrente destes termos será submetida ao foro da Comarca de São Paulo, 
                    Estado de São Paulo, com exclusão de qualquer outro, por mais privilegiado que seja.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    Em caso de conflito entre estes termos e a legislação brasileira aplicável, 
                    prevalecerão as disposições legais, sendo os demais termos mantidos em pleno vigor.
                  </p>
                </div>
              </section>

              {/* Contact Section */}
              <section className="border-t border-slate-200 pt-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Contato</h2>
                <div className="bg-slate-50 rounded-lg p-6">
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Para dúvidas sobre estes Termos de Uso, entre em contato conosco:
                  </p>
                  <div className="space-y-2 text-slate-700">
                    <p><strong>Email:</strong> legal@correria.pro</p>
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
                  to="/politica-de-privacidade"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Política de Privacidade
                </Link>
                <span className="text-slate-300">•</span>
                <Link
                  to="/politica-de-cancelamento"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Política de Cancelamento
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

export default TermsOfServicePage;