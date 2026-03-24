import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PoliticaLGPD = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Política de Proteção de Dados (LGPD)</h1>
        <p className="text-muted-foreground mb-8">Última atualização: 24 de março de 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-foreground/90 leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Compromisso com a LGPD</h2>
            <p>
              A <strong>AGS CONTABILIDADE INTEGRADA LTDA</strong> ("Empresa"), inscrita no CNPJ sob o nº 27.489.165/0001-25, operadora da plataforma <strong>DECLARA IR</strong>, reconhece a importância da proteção de dados pessoais e está comprometida com o cumprimento integral da Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).
            </p>
            <p>
              Esta Política de Proteção de Dados estabelece as diretrizes, procedimentos e medidas adotados pela Empresa para garantir o tratamento adequado, seguro e transparente dos dados pessoais coletados e processados por meio da Plataforma DECLARA IR.
            </p>
            <p>
              A Empresa reconhece que, no contexto de seus serviços, trata dados pessoais de natureza <strong>altamente sensível</strong>, incluindo informações fiscais, patrimoniais e financeiras, o que demanda um nível elevado de proteção e governança.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Definições Legais</h2>
            <p>Para fins desta Política, adotam-se as definições previstas na LGPD:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dado Pessoal:</strong> Informação relacionada a pessoa natural identificada ou identificável (Art. 5º, I da LGPD). No contexto da Plataforma, inclui CPF, nome, dados fiscais, endereço e demais informações inseridas pelos Usuários.</li>
              <li><strong>Dado Pessoal Sensível:</strong> Dado pessoal sobre origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato ou organização, dado de saúde, vida sexual, dado genético ou biométrico (Art. 5º, II). A Plataforma pode tratar dados de saúde quando estes forem inseridos como despesas médicas dedutíveis.</li>
              <li><strong>Titular:</strong> Pessoa natural a quem se referem os dados pessoais tratados (Art. 5º, V). Na Plataforma, inclui os contribuintes cujas declarações são gerenciadas e os contadores cadastrados.</li>
              <li><strong>Controlador:</strong> Pessoa natural ou jurídica a quem competem as decisões sobre o tratamento de dados pessoais (Art. 5º, VI). A AGS CONTABILIDADE INTEGRADA LTDA atua como controladora em relação aos dados necessários para a operação da Plataforma.</li>
              <li><strong>Operador:</strong> Pessoa natural ou jurídica que realiza o tratamento de dados em nome do controlador (Art. 5º, VII). Os escritórios de contabilidade que utilizam a Plataforma podem atuar como controladores ou co-controladores em relação aos dados de seus clientes.</li>
              <li><strong>Encarregado (DPO):</strong> Pessoa indicada pelo controlador para atuar como canal de comunicação entre o controlador, os titulares dos dados e a ANPD (Art. 5º, VIII).</li>
              <li><strong>Tratamento:</strong> Toda operação realizada com dados pessoais, incluindo coleta, produção, recepção, classificação, utilização, acesso, reprodução, transmissão, distribuição, processamento, arquivamento, armazenamento, eliminação, avaliação, controle, modificação, comunicação, transferência, difusão ou extração (Art. 5º, X).</li>
              <li><strong>ANPD:</strong> Autoridade Nacional de Proteção de Dados, órgão responsável por zelar pela proteção de dados pessoais e por implementar e fiscalizar o cumprimento da LGPD no Brasil.</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Princípios da LGPD Observados</h2>
            <p>O tratamento de dados pessoais pela DECLARA IR observa rigorosamente os seguintes princípios estabelecidos pela LGPD (Art. 6º):</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Finalidade:</strong> Todo tratamento de dados é realizado para propósitos legítimos, específicos, explícitos e informados ao titular. Não realizamos tratamento posterior de forma incompatível com essas finalidades.</li>
              <li><strong>Adequação:</strong> O tratamento é compatível com as finalidades informadas ao titular, de acordo com o contexto da prestação de serviços contábeis e fiscais.</li>
              <li><strong>Necessidade:</strong> Limitamos o tratamento ao mínimo necessário para a realização de suas finalidades, com abrangência dos dados pertinentes, proporcionais e não excessivos.</li>
              <li><strong>Livre acesso:</strong> Garantimos ao titular a consulta facilitada e gratuita sobre a forma e a duração do tratamento, bem como a integralidade de seus dados pessoais.</li>
              <li><strong>Qualidade dos dados:</strong> Asseguramos exatidão, clareza, relevância e atualização dos dados, de acordo com a necessidade e para o cumprimento da finalidade do tratamento.</li>
              <li><strong>Transparência:</strong> Garantimos informações claras, precisas e facilmente acessíveis sobre o tratamento e os respectivos agentes de tratamento, observados os segredos comercial e industrial.</li>
              <li><strong>Segurança:</strong> Utilizamos medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou difusão.</li>
              <li><strong>Prevenção:</strong> Adotamos medidas para prevenir a ocorrência de danos em virtude do tratamento de dados pessoais.</li>
              <li><strong>Não discriminação:</strong> Garantimos que o tratamento não será realizado para fins discriminatórios, ilícitos ou abusivos.</li>
              <li><strong>Responsabilização e prestação de contas:</strong> Demonstramos a adoção de medidas eficazes e capazes de comprovar a observância e o cumprimento das normas de proteção de dados pessoais.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Governança de Dados</h2>
            <p>A Empresa implementa as seguintes práticas de governança de dados:</p>

            <p><strong>4.1. Mapeamento de Dados (Data Mapping):</strong> Mantemos registro atualizado das atividades de tratamento de dados pessoais, identificando as categorias de dados tratados, suas finalidades, bases legais, compartilhamentos e prazos de retenção, conforme exigido pelo Art. 37 da LGPD.</p>

            <p><strong>4.2. Privacy by Design e by Default:</strong> Novos produtos, funcionalidades e processos são desenvolvidos considerando, desde a sua concepção, a proteção de dados pessoais como requisito fundamental. As configurações padrão da Plataforma são sempre as mais restritivas em termos de privacidade.</p>

            <p><strong>4.3. Avaliação de Impacto (RIPD):</strong> Realizamos Relatório de Impacto à Proteção de Dados Pessoais quando o tratamento pode gerar riscos às liberdades civis e aos direitos fundamentais dos titulares, especialmente considerando a natureza fiscal e financeira dos dados tratados.</p>

            <p><strong>4.4. Gestão de Terceiros:</strong> Todos os fornecedores e parceiros que tratam dados pessoais em nosso nome são contratualmente obrigados a cumprir padrões adequados de proteção de dados, incluindo cláusulas de confidencialidade, segurança e conformidade com a LGPD.</p>

            <p><strong>4.5. Treinamento e Conscientização:</strong> Colaboradores e prestadores de serviços que têm acesso a dados pessoais são treinados periodicamente sobre práticas de proteção de dados e segurança da informação.</p>

            <p><strong>4.6. Multi-Tenancy e Isolamento de Dados:</strong> A arquitetura da Plataforma implementa isolamento lógico rigoroso entre os dados de diferentes escritórios de contabilidade (multi-tenancy), garantindo que nenhum escritório tenha acesso aos dados de clientes de outro escritório. Este isolamento é aplicado em nível de banco de dados por meio de políticas de segurança em nível de linha (Row-Level Security).</p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Medidas de Segurança</h2>
            <p>A Empresa adota medidas técnicas e administrativas de segurança da informação, incluindo:</p>

            <p><strong>5.1. Medidas Técnicas:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Criptografia de dados em trânsito (TLS 1.2+) e em repouso (AES-256);</li>
              <li>Autenticação segura com hash de senhas (bcrypt);</li>
              <li>Controle de acesso baseado em funções (RBAC) e políticas de segurança em nível de linha (RLS);</li>
              <li>Tokens de sessão com expiração automática;</li>
              <li>Proteção contra ataques comuns (XSS, CSRF, SQL Injection);</li>
              <li>Monitoramento contínuo de infraestrutura e aplicação;</li>
              <li>Backups automatizados com criptografia e teste periódico de restauração;</li>
              <li>Segregação de ambientes (desenvolvimento, homologação e produção).</li>
            </ul>

            <p><strong>5.2. Medidas Administrativas:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Política de controle de acesso com princípio do menor privilégio;</li>
              <li>Procedimentos de revisão periódica de acessos;</li>
              <li>Acordo de confidencialidade (NDA) com todos os colaboradores e prestadores;</li>
              <li>Processo de descarte seguro de dados e equipamentos;</li>
              <li>Trilha de auditoria completa de ações na Plataforma;</li>
              <li>Logs de acesso mantidos por no mínimo 6 (seis) meses, conforme Marco Civil da Internet.</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Gestão de Incidentes de Segurança</h2>
            <p>A Empresa mantém procedimento estruturado para gestão de incidentes de segurança envolvendo dados pessoais:</p>

            <p><strong>6.1. Detecção e Contenção:</strong> Sistemas de monitoramento para identificação rápida de incidentes, com procedimentos de contenção imediata para minimizar danos.</p>

            <p><strong>6.2. Avaliação de Impacto:</strong> Análise da natureza, extensão e gravidade do incidente, incluindo identificação dos dados e titulares afetados.</p>

            <p><strong>6.3. Comunicação à ANPD:</strong> Em caso de incidente que possa acarretar risco ou dano relevante aos titulares, a Empresa comunicará à Autoridade Nacional de Proteção de Dados (ANPD) e aos titulares afetados em prazo razoável, conforme Art. 48 da LGPD, informando:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A descrição da natureza dos dados pessoais afetados;</li>
              <li>As informações sobre os titulares envolvidos;</li>
              <li>A indicação das medidas técnicas e de segurança utilizadas;</li>
              <li>Os riscos relacionados ao incidente;</li>
              <li>Os motivos da demora, caso a comunicação não seja imediata;</li>
              <li>As medidas adotadas ou que serão adotadas para reverter ou mitigar os efeitos do incidente.</li>
            </ul>

            <p><strong>6.4. Comunicação aos Titulares:</strong> Quando o incidente puder acarretar risco ou dano relevante, os titulares serão notificados de forma clara e acessível sobre o ocorrido, os riscos envolvidos e as medidas adotadas.</p>

            <p><strong>6.5. Remediação e Melhoria:</strong> Após a resolução do incidente, a Empresa conduzirá análise post-mortem para identificar causas raízes e implementar medidas corretivas para prevenir recorrências.</p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Direitos dos Titulares</h2>
            <p>
              A Empresa garante aos titulares de dados pessoais o exercício dos direitos previstos nos Arts. 17 a 22 da LGPD:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>I.</strong> Confirmação da existência de tratamento de dados pessoais;</li>
              <li><strong>II.</strong> Acesso aos dados pessoais tratados;</li>
              <li><strong>III.</strong> Correção de dados incompletos, inexatos ou desatualizados;</li>
              <li><strong>IV.</strong> Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD;</li>
              <li><strong>V.</strong> Portabilidade dos dados a outro fornecedor de serviço ou produto, mediante requisição expressa, observados os segredos comercial e industrial;</li>
              <li><strong>VI.</strong> Eliminação dos dados pessoais tratados com base no consentimento, exceto nas hipóteses previstas no Art. 16 da LGPD;</li>
              <li><strong>VII.</strong> Informação sobre entidades públicas e privadas com as quais o controlador realizou compartilhamento de dados;</li>
              <li><strong>VIII.</strong> Informação sobre a possibilidade de não fornecer consentimento e as consequências da negativa;</li>
              <li><strong>IX.</strong> Revogação do consentimento, nos termos do §5º do Art. 8º da LGPD;</li>
              <li><strong>X.</strong> Revisão de decisões tomadas unicamente com base em tratamento automatizado de dados pessoais.</li>
            </ul>

            <p><strong>Procedimento para exercício de direitos:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Solicitações devem ser encaminhadas ao canal de atendimento LGPD (Seção 8);</li>
              <li>A identidade do solicitante será verificada para garantir a segurança dos dados;</li>
              <li>Respostas serão fornecidas em formato simplificado imediatamente ou, em caso de complexidade, em até 15 (quinze) dias, conforme Art. 19 da LGPD;</li>
              <li>Determinados dados poderão ser mantidos mesmo após solicitação de exclusão, quando houver obrigação legal de retenção (ex.: dados fiscais pelo prazo do CTN).</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Canal de Atendimento LGPD</h2>
            <p>
              Para exercer seus direitos como titular de dados pessoais, esclarecer dúvidas sobre esta Política ou reportar incidentes de segurança, entre em contato por meio dos seguintes canais:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
              <p><strong>Encarregado de Proteção de Dados (DPO):</strong> AGS Contabilidade Integrada LTDA</p>
              <p><strong>E-mail para assuntos de privacidade e LGPD:</strong>{" "}
                <a href="mailto:lgpd@declarair.com.br" className="text-primary hover:underline">lgpd@declarair.com.br</a>
              </p>
              <p><strong>E-mail geral:</strong>{" "}
                <a href="mailto:contato@declarair.com.br" className="text-primary hover:underline">contato@declarair.com.br</a>
              </p>
              <p><strong>Plataforma:</strong>{" "}
                <a href="https://declarair.com.br" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">declarair.com.br</a>
              </p>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Caso o titular entenda que o tratamento de seus dados pessoais não está em conformidade com a LGPD, poderá apresentar petição à Autoridade Nacional de Proteção de Dados (ANPD) por meio do site{" "}
              <a href="https://www.gov.br/anpd" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.gov.br/anpd</a>.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Responsável pelo Tratamento</h2>
            <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
              <p><strong>Controlador:</strong> AGS CONTABILIDADE INTEGRADA LTDA</p>
              <p><strong>CNPJ:</strong> 27.489.165/0001-25</p>
              <p><strong>Plataforma:</strong> DECLARA IR (<a href="https://declarair.com.br" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">declarair.com.br</a>)</p>
            </div>

            <p className="mt-4">
              <strong>Papéis e responsabilidades no tratamento de dados:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>AGS Contabilidade (DECLARA IR):</strong> Atua como <strong>controladora</strong> dos dados necessários para a operação e funcionamento da Plataforma, e como <strong>operadora</strong> quando processa dados pessoais em nome dos escritórios de contabilidade que utilizam o serviço.</li>
              <li><strong>Escritórios de contabilidade (Usuários Contadores):</strong> Atuam como <strong>controladores</strong> ou <strong>co-controladores</strong> dos dados pessoais de seus clientes (contribuintes), sendo responsáveis por garantir base legal adequada para a coleta e tratamento desses dados, incluindo obtenção de consentimento quando necessário.</li>
              <li><strong>Provedores de infraestrutura:</strong> Atuam como <strong>operadores</strong>, processando dados conforme instruções da Empresa e em conformidade com contratos que estabelecem obrigações de segurança e confidencialidade.</li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Transferência Internacional de Dados</h2>
            <p>
              A Plataforma poderá utilizar serviços de infraestrutura em nuvem cujos servidores estejam localizados fora do território brasileiro. Nestes casos, a transferência internacional de dados será realizada em conformidade com o Art. 33 da LGPD, observando:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Utilização de provedores que ofereçam nível adequado de proteção de dados, conforme reconhecido pela ANPD;</li>
              <li>Celebração de cláusulas contratuais padrão que garantam a proteção dos dados transferidos;</li>
              <li>Adoção de medidas técnicas suplementares quando necessário para assegurar a efetividade da proteção.</li>
            </ul>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Atualizações desta Política</h2>
            <p>
              Esta Política de Proteção de Dados será revisada e atualizada periodicamente, no mínimo anualmente, ou sempre que houver mudanças significativas nas práticas de tratamento de dados, na legislação aplicável ou nas orientações da ANPD.
            </p>
            <p>
              As alterações serão comunicadas aos Usuários por meio de aviso na Plataforma, e-mail ou outro meio adequado. A versão atualizada estará sempre disponível em{" "}
              <Link to="/politica-lgpd" className="text-primary hover:underline">declarair.com.br/politica-lgpd</Link>.
            </p>
            <p>
              O uso continuado da Plataforma após a publicação de alterações constitui ciência e concordância com a nova versão desta Política.
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

export default PoliticaLGPD;
