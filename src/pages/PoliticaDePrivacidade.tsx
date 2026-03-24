import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PoliticaDePrivacidade = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-8">Última atualização: 24 de março de 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-foreground/90 leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Introdução</h2>
            <p>
              A <strong>AGS CONTABILIDADE INTEGRADA LTDA</strong> ("Empresa", "Nós"), inscrita no CNPJ sob o nº 27.489.165/0001-25, operadora da plataforma <strong>DECLARA IR</strong> (
              <a href="https://declarair.com.br" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">declarair.com.br</a>
              ), está comprometida com a proteção da privacidade e dos dados pessoais de seus Usuários.
            </p>
            <p>
              Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos, compartilhamos e protegemos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD), o Marco Civil da Internet (Lei nº 12.965/2014) e demais normas aplicáveis.
            </p>
            <p>
              Ao utilizar a Plataforma, o Usuário declara ciência e concordância com as práticas descritas nesta Política. Recomendamos a leitura atenta e integral deste documento.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Dados Coletados</h2>
            <p>No âmbito da prestação de nossos serviços, podemos coletar as seguintes categorias de dados pessoais:</p>

            <p><strong>2.1. Dados de Identificação e Cadastro:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nome completo, CPF, data de nascimento;</li>
              <li>Endereço de e-mail, número de telefone e WhatsApp;</li>
              <li>Estado civil, dados do cônjuge (nome, CPF);</li>
              <li>Dados profissionais (para contadores): nome do escritório, CNPJ, CRC, endereço comercial.</li>
            </ul>

            <p><strong>2.2. Dados Fiscais e Financeiros:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Rendimentos de todas as fontes (emprego, autônomo, aluguéis, investimentos);</li>
              <li>Bens e direitos (imóveis, veículos, aplicações financeiras, participações societárias);</li>
              <li>Dívidas e ônus reais;</li>
              <li>Despesas dedutíveis (médicas, educacionais, previdenciárias);</li>
              <li>Dados de dependentes (nome, CPF, data de nascimento, parentesco);</li>
              <li>Informações sobre pensão alimentícia, doações e heranças;</li>
              <li>Número de recibo de declarações anteriores;</li>
              <li>Dados bancários para restituição.</li>
            </ul>

            <p><strong>2.3. Dados Documentais:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Documentos digitalizados (informes de rendimentos, comprovantes, recibos);</li>
              <li>Arquivos enviados pelo portal do cliente.</li>
            </ul>

            <p><strong>2.4. Dados de Navegação e Técnicos:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Endereço IP, geolocalização aproximada;</li>
              <li>Tipo de navegador, sistema operacional, dispositivo utilizado;</li>
              <li>Páginas acessadas, tempo de permanência, data e hora de acesso;</li>
              <li>Dados de cookies e tecnologias similares (conforme Seção 8).</li>
            </ul>

            <p><strong>2.5. Dados de Comunicação:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Mensagens trocadas pelo chat interno da Plataforma;</li>
              <li>E-mails e notificações enviados pela Plataforma;</li>
              <li>Registros de solicitações de suporte.</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Finalidade do Tratamento</h2>
            <p>Os dados pessoais coletados são tratados para as seguintes finalidades:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Prestação do serviço:</strong> Viabilizar o cadastro, gerenciamento de declarações de IR, coleta de documentos, cálculos tributários e comunicação entre contadores e clientes;</li>
              <li><strong>Cumprimento de obrigações legais e regulatórias:</strong> Atender a exigências da Receita Federal do Brasil, órgãos fiscalizadores e legislação tributária vigente;</li>
              <li><strong>Gestão contratual:</strong> Processar pagamentos, emitir cobranças e gerenciar a relação comercial;</li>
              <li><strong>Comunicação:</strong> Enviar notificações sobre status de declarações, vencimentos, atualizações da Plataforma e comunicados relevantes;</li>
              <li><strong>Segurança:</strong> Prevenir fraudes, monitorar atividades suspeitas e garantir a integridade da Plataforma;</li>
              <li><strong>Melhoria do serviço:</strong> Analisar padrões de uso para aprimorar funcionalidades e experiência do Usuário;</li>
              <li><strong>Exercício regular de direitos:</strong> Produzir provas em processos judiciais, administrativos ou arbitrais.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Bases Legais para o Tratamento (LGPD)</h2>
            <p>O tratamento de dados pessoais pela DECLARA IR fundamenta-se nas seguintes bases legais previstas na LGPD:</p>

            <p><strong>a) Execução de contrato ou procedimentos preliminares (Art. 7º, V):</strong> Para viabilizar a prestação dos serviços contratados, incluindo cadastro, gerenciamento de declarações e processamento de pagamentos.</p>

            <p><strong>b) Cumprimento de obrigação legal ou regulatória (Art. 7º, II):</strong> Para atender a exigências da legislação tributária, fiscal e contábil brasileira, incluindo a manutenção de registros pelo prazo legalmente exigido.</p>

            <p><strong>c) Consentimento (Art. 7º, I):</strong> Quando necessário para finalidades específicas não cobertas pelas demais bases legais, como o envio de comunicações de marketing ou uso de cookies não essenciais.</p>

            <p><strong>d) Legítimo interesse (Art. 7º, IX):</strong> Para fins de segurança da Plataforma, prevenção contra fraudes, melhoria de serviços e análise de uso, sempre respeitando os direitos e expectativas razoáveis do titular.</p>

            <p><strong>e) Exercício regular de direitos (Art. 7º, VI):</strong> Para produção de provas em processos judiciais, administrativos ou arbitrais.</p>

            <p><strong>f) Proteção do crédito (Art. 7º, X):</strong> Para análise e gestão de cobranças relacionadas aos serviços prestados.</p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Compartilhamento de Dados</h2>
            <p>Os dados pessoais poderão ser compartilhados com os seguintes destinatários, sempre observando as finalidades descritas nesta Política:</p>

            <p><strong>5.1. Contadores e escritórios de contabilidade:</strong> Os dados fiscais e pessoais dos clientes são compartilhados com o contador responsável vinculado na Plataforma, para fins de elaboração e transmissão da declaração de IR.</p>

            <p><strong>5.2. Receita Federal do Brasil:</strong> Dados necessários para a transmissão das declarações de IRPF, conforme exigido pela legislação tributária.</p>

            <p><strong>5.3. Provedores de tecnologia e infraestrutura:</strong> Empresas que fornecem serviços essenciais à operação da Plataforma, como hospedagem em nuvem, processamento de dados, envio de e-mails e armazenamento seguro de arquivos. Estes provedores são contratualmente obrigados a proteger os dados conforme padrões adequados de segurança.</p>

            <p><strong>5.4. Instituições financeiras e processadores de pagamento:</strong> Para viabilizar a emissão de cobranças (PIX, boleto) e processamento de pagamentos.</p>

            <p><strong>5.5. Autoridades públicas:</strong> Quando exigido por determinação legal, judicial ou regulatória.</p>

            <p><strong>5.6. APIs e serviços governamentais:</strong> Quando a Plataforma integra-se a sistemas da Receita Federal ou outros órgãos para consultas automatizadas (ex.: consulta de malha fina), os dados são transmitidos de forma segura e exclusivamente para a finalidade específica.</p>

            <p>
              A Empresa <strong>não comercializa, aluga ou distribui</strong> dados pessoais de seus Usuários para terceiros com finalidades de marketing, publicidade ou qualquer outro propósito alheio à prestação dos serviços.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Armazenamento e Segurança</h2>
            <p>
              Os dados pessoais são armazenados em infraestrutura de nuvem com padrões internacionais de segurança, incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Criptografia em trânsito:</strong> Comunicações protegidas por protocolo TLS/SSL;</li>
              <li><strong>Criptografia em repouso:</strong> Dados sensíveis armazenados com criptografia AES-256;</li>
              <li><strong>Controle de acesso:</strong> Autenticação por credenciais individuais, com segregação de acessos por perfil (Row-Level Security);</li>
              <li><strong>Isolamento multi-tenant:</strong> Dados de cada escritório isolados logicamente, impedindo acesso cruzado;</li>
              <li><strong>Backups regulares:</strong> Cópias de segurança automatizadas com política de retenção;</li>
              <li><strong>Monitoramento:</strong> Logs de acesso e atividades para fins de auditoria e detecção de anomalias;</li>
              <li><strong>Trilha de auditoria:</strong> Registro de todas as ações relevantes realizadas na Plataforma.</li>
            </ul>
            <p>
              Apesar das medidas de segurança adotadas, nenhum sistema de informação é absolutamente seguro. A Empresa emprega os melhores esforços para proteger os dados, mas não pode garantir segurança absoluta contra ameaças cibernéticas sofisticadas.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Direitos do Titular dos Dados</h2>
            <p>
              Em conformidade com a LGPD, o titular dos dados pessoais possui os seguintes direitos, que podem ser exercidos mediante solicitação ao nosso canal de atendimento:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Confirmação e acesso:</strong> Confirmar a existência de tratamento e acessar seus dados pessoais;</li>
              <li><strong>Correção:</strong> Solicitar a correção de dados incompletos, inexatos ou desatualizados;</li>
              <li><strong>Anonimização, bloqueio ou eliminação:</strong> De dados desnecessários, excessivos ou tratados em desconformidade com a LGPD;</li>
              <li><strong>Portabilidade:</strong> Solicitar a portabilidade dos dados a outro fornecedor de serviço, mediante requisição expressa;</li>
              <li><strong>Eliminação:</strong> Solicitar a eliminação dos dados pessoais tratados com base no consentimento;</li>
              <li><strong>Informação sobre compartilhamento:</strong> Obter informações sobre entidades públicas e privadas com as quais seus dados foram compartilhados;</li>
              <li><strong>Revogação do consentimento:</strong> Revogar o consentimento a qualquer tempo, sem prejuízo da legalidade do tratamento realizado anteriormente;</li>
              <li><strong>Oposição:</strong> Opor-se ao tratamento realizado com base em legítimo interesse, caso entenda que há violação à LGPD;</li>
              <li><strong>Revisão de decisões automatizadas:</strong> Solicitar a revisão de decisões tomadas unicamente com base em tratamento automatizado de dados.</li>
            </ul>
            <p>
              As solicitações serão respondidas no prazo de 15 (quinze) dias, conforme previsto na LGPD. Determinados dados poderão ser mantidos mesmo após solicitação de exclusão, quando houver obrigação legal ou regulatória para sua retenção.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Cookies e Tecnologias de Rastreamento</h2>
            <p>A Plataforma utiliza cookies e tecnologias similares para:</p>

            <p><strong>8.1. Cookies Essenciais:</strong> Necessários para o funcionamento básico da Plataforma, como autenticação, manutenção de sessão e segurança. Não podem ser desativados.</p>

            <p><strong>8.2. Cookies de Desempenho:</strong> Coletam informações sobre como os Usuários utilizam a Plataforma, permitindo melhorias de performance e usabilidade.</p>

            <p><strong>8.3. Cookies Funcionais:</strong> Armazenam preferências do Usuário, como idioma e configurações de exibição.</p>

            <p>
              O Usuário pode gerenciar suas preferências de cookies por meio das configurações do navegador. A desativação de cookies essenciais poderá comprometer o funcionamento adequado da Plataforma.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Retenção de Dados</h2>
            <p>Os dados pessoais serão mantidos pelo período necessário para atender às finalidades para as quais foram coletados, observando os seguintes critérios:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Dados fiscais e tributários:</strong> Mantidos pelo prazo mínimo de 5 (cinco) anos, conforme exigência do Código Tributário Nacional (Art. 173 e 174 do CTN), ou pelo prazo que a legislação específica determinar;</li>
              <li><strong>Dados contratuais:</strong> Mantidos durante a vigência do contrato e por 5 (cinco) anos após seu encerramento, para fins de exercício regular de direitos;</li>
              <li><strong>Dados de navegação e logs:</strong> Mantidos pelo prazo mínimo de 6 (seis) meses, conforme o Marco Civil da Internet (Art. 15);</li>
              <li><strong>Dados tratados com base no consentimento:</strong> Mantidos até a revogação do consentimento pelo titular, ressalvadas as obrigações legais de retenção.</li>
            </ul>
            <p>
              Após o término do período de retenção, os dados serão eliminados ou anonimizados de forma segura e irreversível.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Alterações nesta Política</h2>
            <p>
              Esta Política de Privacidade poderá ser atualizada periodicamente para refletir mudanças em nossas práticas de tratamento de dados, na legislação aplicável ou nas funcionalidades da Plataforma.
            </p>
            <p>
              Alterações substanciais serão comunicadas aos Usuários por meio de aviso na Plataforma ou por e-mail. Recomendamos a consulta periódica deste documento.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Contato do Encarregado de Proteção de Dados (DPO)</h2>
            <p>
              Para exercer seus direitos, esclarecer dúvidas ou enviar solicitações relacionadas ao tratamento de seus dados pessoais, entre em contato com nosso Encarregado de Proteção de Dados:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p><strong>Encarregado (DPO):</strong> AGS Contabilidade Integrada LTDA</p>
              <p><strong>E-mail:</strong> <a href="mailto:privacidade@declarair.com.br" className="text-primary hover:underline">privacidade@declarair.com.br</a></p>
              <p><strong>Plataforma:</strong> <a href="https://declarair.com.br" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">declarair.com.br</a></p>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Caso não obtenha resposta satisfatória, o titular poderá apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD) por meio do site{" "}
              <a href="https://www.gov.br/anpd" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.gov.br/anpd</a>.
            </p>
          </section>

          <div className="border-t border-border pt-6 mt-12">
            <p className="text-sm text-muted-foreground">
              <strong>AGS CONTABILIDADE INTEGRADA LTDA</strong><br />
              CNPJ: 27.489.165/0001-25<br />
              Plataforma DECLARA IR —{" "}
              <a href="https://declarair.com.br" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                declarair.com.br
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliticaDePrivacidade;
