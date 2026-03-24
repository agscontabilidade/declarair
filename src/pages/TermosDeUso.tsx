import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermosDeUso = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Termos de Uso</h1>
        <p className="text-muted-foreground mb-8">Última atualização: 24 de março de 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-foreground/90 leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar, cadastrar-se ou utilizar a plataforma <strong>DECLARA IR</strong> (disponível em{" "}
              <a href="https://declarair.com.br" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                declarair.com.br
              </a>
              ), o Usuário declara ter lido, compreendido e aceito integralmente os presentes Termos de Uso, bem como a{" "}
              <Link to="/politica-de-privacidade" className="text-primary hover:underline">Política de Privacidade</Link> e a{" "}
              <Link to="/politica-lgpd" className="text-primary hover:underline">Política de Proteção de Dados (LGPD)</Link>.
            </p>
            <p>
              Caso o Usuário não concorde com quaisquer disposições aqui estabelecidas, deverá cessar imediatamente o uso da Plataforma. A utilização continuada após a publicação de alterações constitui aceitação tácita dos novos termos.
            </p>
            <p>
              A Plataforma é operada por <strong>AGS CONTABILIDADE INTEGRADA LTDA</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 27.489.165/0001-25, doravante denominada "Empresa", "Nós" ou "DECLARA IR".
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Objeto da Plataforma</h2>
            <p>
              A plataforma DECLARA IR é um sistema SaaS (Software as a Service) desenvolvido para escritórios de contabilidade e profissionais contábeis, com o objetivo de:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Gerenciar e organizar declarações de Imposto de Renda Pessoa Física (IRPF) de seus clientes;</li>
              <li>Coletar, armazenar e processar informações fiscais, patrimoniais e pessoais dos contribuintes;</li>
              <li>Facilitar a comunicação entre contadores e seus clientes por meio de portal exclusivo;</li>
              <li>Automatizar o controle de documentos, cobranças e prazos relacionados a obrigações tributárias;</li>
              <li>Fornecer ferramentas de cálculo, checklist documental e acompanhamento de status das declarações;</li>
              <li>Possibilitar a emissão de cobranças e gestão financeira dos serviços contábeis prestados.</li>
            </ul>
            <p>
              A Plataforma <strong>não substitui</strong> o trabalho do profissional contábil habilitado perante o Conselho Regional de Contabilidade (CRC), tampouco constitui consultoria tributária, fiscal ou jurídica. A responsabilidade técnica pela elaboração e transmissão das declarações permanece exclusivamente com o contador responsável.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Cadastro do Usuário</h2>
            <p>
              Para utilizar a Plataforma, o Usuário deverá realizar cadastro fornecendo informações verídicas, completas e atualizadas. Existem duas categorias de Usuários:
            </p>
            <p><strong>a) Usuário Contador (Escritório):</strong> Profissional contábil ou escritório de contabilidade que contrata o serviço para gerenciar declarações de seus clientes. O cadastro exige nome completo, e-mail corporativo, dados do escritório e, quando aplicável, CNPJ.</p>
            <p><strong>b) Usuário Cliente (Contribuinte):</strong> Pessoa física que acessa o portal do cliente mediante convite do contador responsável, para fornecer documentos, preencher formulários e acompanhar o andamento de sua declaração.</p>
            <p>
              O Usuário é integralmente responsável pela veracidade das informações fornecidas no cadastro e pela manutenção da confidencialidade de suas credenciais de acesso (e-mail e senha). Qualquer atividade realizada sob suas credenciais será de sua exclusiva responsabilidade.
            </p>
            <p>
              A Empresa reserva-se o direito de recusar, suspender ou cancelar cadastros que contenham informações falsas, incompletas ou que violem estes Termos.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Uso da Plataforma</h2>
            <p><strong>4.1. Uso Permitido:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Utilizar as funcionalidades da Plataforma exclusivamente para os fins previstos nestes Termos;</li>
              <li>Inserir dados fiscais e pessoais de clientes mediante autorização expressa dos mesmos;</li>
              <li>Gerar relatórios, cálculos e documentos dentro do escopo da Plataforma;</li>
              <li>Comunicar-se com clientes por meio dos canais internos disponibilizados.</li>
            </ul>
            <p><strong>4.2. Uso Proibido:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Utilizar a Plataforma para fins ilegais, fraudulentos ou que violem a legislação tributária vigente;</li>
              <li>Inserir dados fictícios, falsificados ou de terceiros sem autorização;</li>
              <li>Tentar acessar áreas restritas do sistema, realizar engenharia reversa, descompilar ou modificar o código-fonte;</li>
              <li>Utilizar robôs, scrapers ou qualquer mecanismo automatizado para extrair dados da Plataforma sem autorização;</li>
              <li>Compartilhar credenciais de acesso com terceiros não autorizados;</li>
              <li>Sobrecarregar intencionalmente os servidores ou interferir no funcionamento da Plataforma;</li>
              <li>Reproduzir, distribuir ou comercializar qualquer conteúdo da Plataforma sem autorização prévia e por escrito.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Responsabilidades do Usuário</h2>
            <p>O Usuário compromete-se a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Fornecer informações verdadeiras, precisas e atualizadas, tanto em seu cadastro quanto nos dados fiscais e documentos inseridos na Plataforma;</li>
              <li>Manter suas credenciais de acesso em sigilo e notificar imediatamente a Empresa em caso de uso não autorizado de sua conta;</li>
              <li>Garantir que possui autorização dos titulares dos dados pessoais inseridos na Plataforma, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018);</li>
              <li>Utilizar a Plataforma em conformidade com a legislação brasileira vigente, incluindo, mas não se limitando a, legislação tributária, trabalhista e de proteção de dados;</li>
              <li>Não utilizar a Plataforma para a prática de evasão fiscal, lavagem de dinheiro, sonegação ou qualquer outra atividade ilícita;</li>
              <li>Responsabilizar-se integralmente por quaisquer danos causados à Empresa, a outros Usuários ou a terceiros em decorrência do uso indevido da Plataforma.</li>
            </ul>
            <p>
              O Usuário Contador reconhece que atua como <strong>operador de dados</strong> em relação aos dados pessoais de seus clientes, nos termos da LGPD, sendo responsável por garantir base legal adequada para o tratamento desses dados.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Responsabilidades da Empresa</h2>
            <p>A Empresa compromete-se a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Disponibilizar a Plataforma em funcionamento regular, empregando esforços comercialmente razoáveis para manter sua disponibilidade e segurança;</li>
              <li>Implementar medidas técnicas e administrativas de segurança da informação para proteger os dados armazenados;</li>
              <li>Notificar os Usuários sobre manutenções programadas que possam afetar a disponibilidade do serviço, sempre que possível com antecedência;</li>
              <li>Atender às solicitações dos titulares de dados nos termos da LGPD.</li>
            </ul>
            <p>
              A Empresa <strong>não garante</strong> disponibilidade ininterrupta ou livre de erros da Plataforma. Interrupções poderão ocorrer por motivos de manutenção, atualizações, falhas técnicas, caso fortuito ou força maior, sem que isso gere direito a indenização.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Limitação de Responsabilidade</h2>
            <p>
              A Empresa <strong>não se responsabiliza</strong> por:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Erros, omissões ou inconsistências nos dados e documentos inseridos pelos Usuários na Plataforma;</li>
              <li>Declarações de Imposto de Renda elaboradas com base em informações incorretas, incompletas ou fraudulentas fornecidas pelo Usuário;</li>
              <li>Prejuízos decorrentes de multas, autuações fiscais, retenções em malha fina ou quaisquer penalidades impostas pela Receita Federal do Brasil em razão de informações incorretas;</li>
              <li>Falhas, interrupções ou indisponibilidades de serviços de terceiros, incluindo provedores de infraestrutura, APIs governamentais e sistemas bancários;</li>
              <li>Danos indiretos, incidentais, consequenciais, punitivos ou lucros cessantes, ainda que a Empresa tenha sido alertada sobre a possibilidade de tais danos;</li>
              <li>Uso indevido da Plataforma por Usuários ou terceiros que obtenham acesso mediante credenciais compartilhadas ou comprometidas.</li>
            </ul>
            <p>
              Em qualquer hipótese, a responsabilidade total da Empresa estará limitada ao valor efetivamente pago pelo Usuário nos 12 (doze) meses anteriores ao evento que deu origem à reclamação.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Propriedade Intelectual</h2>
            <p>
              Todos os direitos de propriedade intelectual relativos à Plataforma DECLARA IR, incluindo, mas não se limitando a, software, código-fonte, algoritmos, interface gráfica, design, textos, logotipos, marcas, ícones, bases de dados e documentação técnica, são de titularidade exclusiva da AGS CONTABILIDADE INTEGRADA LTDA ou de seus licenciadores.
            </p>
            <p>
              O uso da Plataforma não confere ao Usuário qualquer direito de propriedade sobre o software ou seus componentes. É concedida ao Usuário uma licença limitada, não exclusiva, intransferível e revogável para utilização da Plataforma durante a vigência da relação contratual, exclusivamente para os fins previstos nestes Termos.
            </p>
            <p>
              Qualquer reprodução, modificação, distribuição, engenharia reversa ou uso não autorizado dos elementos protegidos constitui violação de direitos autorais e de propriedade industrial, sujeitando o infrator às sanções civis e penais cabíveis, nos termos da Lei nº 9.610/1998 (Direitos Autorais) e da Lei nº 9.279/1996 (Propriedade Industrial).
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Suspensão ou Cancelamento de Conta</h2>
            <p>
              A Empresa poderá, a seu exclusivo critério e sem necessidade de aviso prévio, suspender ou cancelar a conta do Usuário nas seguintes hipóteses:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Violação de quaisquer disposições destes Termos de Uso;</li>
              <li>Fornecimento de informações falsas ou fraudulentas;</li>
              <li>Prática de atividades ilegais ou que possam causar danos à Empresa, a outros Usuários ou a terceiros;</li>
              <li>Inadimplência por período superior a 30 (trinta) dias;</li>
              <li>Inatividade da conta por período superior a 12 (doze) meses;</li>
              <li>Determinação judicial ou administrativa;</li>
              <li>Tentativa de acesso não autorizado a dados de outros Usuários ou a áreas restritas do sistema.</li>
            </ul>
            <p>
              Em caso de cancelamento, os dados do Usuário serão mantidos pelo período exigido pela legislação aplicável, especialmente para fins tributários e de proteção de dados, sendo posteriormente eliminados de forma segura.
            </p>
            <p>
              O Usuário poderá solicitar o cancelamento de sua conta a qualquer momento por meio dos canais de atendimento da Plataforma, respeitadas as obrigações contratuais vigentes.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Uso de Automação e Inteligência Artificial</h2>
            <p>
              A Plataforma poderá utilizar recursos de automação e inteligência artificial para otimizar processos como cálculos tributários, verificação de consistência de dados, sugestões de preenchimento e análise de documentos.
            </p>
            <p>
              O Usuário reconhece que tais ferramentas são auxiliares e <strong>não substituem a análise e responsabilidade do profissional contábil</strong>. Os resultados gerados por automação devem ser sempre revisados e validados pelo contador responsável antes de qualquer transmissão à Receita Federal.
            </p>
            <p>
              A Empresa não se responsabiliza por decisões tomadas exclusivamente com base em resultados automatizados sem a devida revisão profissional.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Prevenção contra Fraudes e Auditoria</h2>
            <p>
              A Empresa adota medidas de prevenção contra fraudes, incluindo monitoramento de atividades suspeitas, registro de logs de acesso e ações realizadas na Plataforma (trilha de auditoria), e análise de padrões de uso.
            </p>
            <p>
              O Usuário reconhece e concorda que todas as ações realizadas na Plataforma são registradas e rastreáveis, podendo ser utilizadas como evidência em procedimentos administrativos, judiciais ou regulatórios.
            </p>
            <p>
              Em caso de identificação de atividade suspeita ou potencialmente fraudulenta, a Empresa poderá:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Suspender preventivamente o acesso à conta;</li>
              <li>Solicitar documentação adicional para verificação de identidade;</li>
              <li>Comunicar as autoridades competentes, conforme exigido pela legislação aplicável.</li>
            </ul>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">12. Modificações dos Termos</h2>
            <p>
              A Empresa reserva-se o direito de modificar estes Termos de Uso a qualquer tempo, mediante publicação da versão atualizada na Plataforma. As alterações entrarão em vigor na data de sua publicação.
            </p>
            <p>
              Os Usuários serão notificados sobre alterações substanciais por meio de comunicação na Plataforma ou por e-mail. O uso continuado da Plataforma após a publicação das alterações constitui aceitação dos novos termos.
            </p>
            <p>
              O Usuário que não concordar com as alterações poderá cancelar sua conta nos termos da Seção 9.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">13. Disposições Gerais</h2>
            <p>
              A eventual tolerância da Empresa quanto ao descumprimento de quaisquer disposições destes Termos não constituirá renúncia ao direito de exigir o cumprimento da obrigação, nem precedente invocável pelo Usuário.
            </p>
            <p>
              Se qualquer cláusula destes Termos for considerada inválida ou inexequível, as demais cláusulas permanecerão em pleno vigor e efeito.
            </p>
            <p>
              Estes Termos constituem o acordo integral entre o Usuário e a Empresa no que diz respeito ao uso da Plataforma, substituindo quaisquer acordos anteriores, escritos ou verbais.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">14. Foro e Legislação Aplicável</h2>
            <p>
              Estes Termos de Uso são regidos pela legislação da República Federativa do Brasil, em especial pelo Código Civil (Lei nº 10.406/2002), Código de Defesa do Consumidor (Lei nº 8.078/1990, quando aplicável), Marco Civil da Internet (Lei nº 12.965/2014) e Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).
            </p>
            <p>
              Para dirimir quaisquer controvérsias oriundas destes Termos, fica eleito o foro da Comarca da sede da AGS CONTABILIDADE INTEGRADA LTDA, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
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

export default TermosDeUso;
