import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
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
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Política de Privacidade
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Nosso compromisso com a proteção dos seus dados pessoais e conformidade com a LGPD.
            </p>
            <div className="mt-6 text-sm text-slate-500">
              <p>Última atualização: 26 de janeiro de 2025</p>
              <p>Versão: 1.0 - Conforme LGPD (Lei 13.709/2018)</p>
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
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">1. Introdução</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">
                    A Correria.Pro está comprometida com a proteção da privacidade e dos dados pessoais de todos os usuários. 
                    Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações 
                    pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                    <p className="text-green-800 font-medium">
                      <strong>Compromisso LGPD:</strong> Respeitamos todos os seus direitos como titular de dados pessoais 
                      e implementamos as melhores práticas de segurança e governança de dados.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Database className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">2. Dados Coletados</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">2.1 Dados de Cadastro do Treinador</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li><strong>Dados de Identificação:</strong> Nome completo, email, telefone</li>
                    <li><strong>Dados de Acesso:</strong> Senha criptografada, preferências de conta</li>
                    <li><strong>Dados Profissionais:</strong> Informações sobre sua atuação como treinador</li>
                    <li><strong>Dados de Pagamento:</strong> Informações de faturamento (processadas por terceiros seguros)</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-6">2.2 Dados dos Atletas</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Como treinador, você insere dados de seus atletas na plataforma:
                  </p>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li><strong>Dados Pessoais:</strong> Nome, idade, dados antropométricos</li>
                    <li><strong>Dados de Saúde:</strong> Frequência cardíaca, histórico de lesões, limitações médicas</li>
                    <li><strong>Dados de Performance:</strong> Tempos, distâncias, progressão nos treinos</li>
                    <li><strong>Dados de Contato:</strong> Email para envio de treinos (quando fornecido)</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-6">2.3 Dados de Navegação e Uso</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li><strong>Dados Técnicos:</strong> Endereço IP, tipo de navegador, sistema operacional</li>
                    <li><strong>Dados de Uso:</strong> Páginas visitadas, tempo de sessão, funcionalidades utilizadas</li>
                    <li><strong>Cookies:</strong> Cookies essenciais para funcionamento da plataforma</li>
                    <li><strong>Logs de Sistema:</strong> Registros de atividade para segurança e suporte técnico</li>
                  </ul>
                </div>
              </section>

              {/* Section 3 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Eye className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">3. Finalidade da Coleta</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">
                    Utilizamos seus dados pessoais exclusivamente para as seguintes finalidades legítimas:
                  </p>
                  
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-4">3.1 Prestação do Serviço</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li>Gerar treinos personalizados utilizando Inteligência Artificial</li>
                    <li>Fornecer dashboard analítico e relatórios de performance</li>
                    <li>Facilitar a comunicação entre treinador e atletas</li>
                    <li>Permitir exportação e compartilhamento de treinos</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-4">3.2 Processamento de Pagamentos</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li>Processar assinaturas e pagamentos mensais/anuais</li>
                    <li>Emitir faturas e comprovantes fiscais</li>
                    <li>Gerenciar períodos de teste e upgrades de plano</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-4">3.3 Melhoria do Serviço</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li>Aprimorar algoritmos de IA para geração de treinos mais eficazes</li>
                    <li>Desenvolver novas funcionalidades baseadas no uso da plataforma</li>
                    <li>Realizar análises estatísticas agregadas e anonimizadas</li>
                    <li>Fornecer suporte técnico personalizado</li>
                  </ul>
                </div>
              </section>

              {/* Section 4 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <UserCheck className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">4. Compartilhamento de Dados</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">
                    Seus dados são compartilhados apenas nas seguintes situações, sempre com as devidas proteções:
                  </p>

                  <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-4">4.1 Provedores de IA</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li>Dados de atletas são enviados de forma <strong>anonimizada</strong> para gerar treinos</li>
                    <li>Utilizamos provedores como OpenAI, Anthropic e Google AI</li>
                    <li>Nenhum dado pessoal identificável é compartilhado</li>
                    <li>Dados são processados apenas para geração de treinos específicos</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-4">4.2 Gateways de Pagamento</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li>Stripe e Mercado Pago para processamento seguro de pagamentos</li>
                    <li>Apenas dados necessários para transação (nome, email, dados de cobrança)</li>
                    <li>Dados de cartão são processados diretamente pelos gateways (PCI DSS)</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-4">4.3 Prestadores de Serviço</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li>Supabase para hospedagem segura do banco de dados</li>
                    <li>Provedores de email para comunicações transacionais</li>
                    <li>Serviços de monitoramento e analytics (dados agregados)</li>
                  </ul>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-blue-800 font-medium">
                      <strong>Garantia:</strong> Todos os nossos parceiros são rigorosamente selecionados e 
                      aderem aos mesmos padrões de proteção de dados que seguimos.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <Lock className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">5. Segurança dos Dados</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">
                    Implementamos múltiplas camadas de segurança para proteger seus dados:
                  </p>

                  <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-4">5.1 Segurança Técnica</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li><strong>Criptografia:</strong> Todos os dados são criptografados em trânsito (TLS 1.3) e em repouso (AES-256)</li>
                    <li><strong>RLS (Row Level Security):</strong> Cada usuário acessa apenas seus próprios dados</li>
                    <li><strong>Autenticação Segura:</strong> Senhas hasheadas com bcrypt, autenticação multifator disponível</li>
                    <li><strong>Backup Automático:</strong> Backups diários com retenção de 30 dias</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-4">5.2 Segurança Operacional</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li><strong>Monitoramento 24/7:</strong> Detecção automática de atividades suspeitas</li>
                    <li><strong>Logs de Auditoria:</strong> Registro completo de todas as ações na plataforma</li>
                    <li><strong>Acesso Restrito:</strong> Apenas pessoal autorizado tem acesso aos servidores</li>
                    <li><strong>Atualizações Regulares:</strong> Patches de segurança aplicados imediatamente</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-4">5.3 Conformidade</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li>Infraestrutura hospedada em provedores certificados (AWS, Google Cloud)</li>
                    <li>Conformidade com padrões internacionais de segurança</li>
                    <li>Auditorias regulares de segurança e penetration testing</li>
                  </ul>
                </div>
              </section>

              {/* Section 6 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <UserCheck className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">6. Direitos do Titular (LGPD)</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">
                    Conforme a LGPD, você possui os seguintes direitos sobre seus dados pessoais:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-2">✓ Confirmação e Acesso</h4>
                      <p className="text-sm text-slate-700">Confirmar se tratamos seus dados e acessar suas informações</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-2">✓ Correção</h4>
                      <p className="text-sm text-slate-700">Corrigir dados incompletos, inexatos ou desatualizados</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-2">✓ Anonimização ou Exclusão</h4>
                      <p className="text-sm text-slate-700">Solicitar anonimização ou exclusão de dados desnecessários</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-2">✓ Portabilidade</h4>
                      <p className="text-sm text-slate-700">Exportar seus dados em formato estruturado</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-2">✓ Informação sobre Compartilhamento</h4>
                      <p className="text-sm text-slate-700">Saber com quem compartilhamos seus dados</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-2">✓ Revogação do Consentimento</h4>
                      <p className="text-sm text-slate-700">Retirar consentimento quando aplicável</p>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                    <p className="text-green-800">
                      <strong>Como Exercer seus Direitos:</strong> Entre em contato através do email 
                      <strong> dpo@correria.pro</strong> ou pelo formulário de contato em nossa plataforma. 
                      Responderemos em até 15 dias úteis.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 7 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <Eye className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">7. Uso de Cookies</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">
                    Utilizamos cookies essenciais para o funcionamento da plataforma:
                  </p>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li><strong>Cookies de Sessão:</strong> Para manter você logado durante o uso</li>
                    <li><strong>Cookies de Preferência:</strong> Para lembrar suas configurações</li>
                    <li><strong>Cookies de Segurança:</strong> Para proteger contra ataques e fraudes</li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed">
                    Para informações detalhadas sobre nosso uso de cookies, consulte nossa 
                    <Link to="/politica-de-cookies" className="text-blue-600 hover:text-blue-700 font-medium"> Política de Cookies</Link>.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">8. Contato do Encarregado de Dados (DPO)</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">
                    Para questões relacionadas à proteção de dados pessoais, entre em contato com nosso 
                    Encarregado de Proteção de Dados (DPO):
                  </p>
                  <div className="bg-slate-50 rounded-lg p-6 mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="font-medium text-slate-900">Email do DPO</p>
                          <p className="text-slate-700">dpo@correria.pro</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="font-medium text-slate-900">Telefone</p>
                          <p className="text-slate-700">(11) 9999-9999</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="font-medium text-slate-900">Horário de Atendimento</p>
                          <p className="text-slate-700">Segunda a Sexta, 9h às 18h</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed mt-4">
                    <strong>Tempo de Resposta:</strong> Garantimos resposta em até 15 dias úteis para todas as solicitações 
                    relacionadas à proteção de dados pessoais.
                  </p>
                </div>
              </section>

              {/* Updates Section */}
              <section className="border-t border-slate-200 pt-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Atualizações desta Política</h2>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">
                    Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças em nossas 
                    práticas ou na legislação aplicável. Notificaremos sobre alterações significativas através de:
                  </p>
                  <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                    <li>Email para todos os usuários registrados</li>
                    <li>Aviso destacado na plataforma</li>
                    <li>Atualização da data de "Última atualização" nesta página</li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed">
                    Recomendamos que você revise esta política periodicamente para se manter informado sobre 
                    como protegemos suas informações.
                  </p>
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
                  to="/politica-de-cookies"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Política de Cookies
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

export default PrivacyPolicyPage;