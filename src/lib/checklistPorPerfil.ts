/**
 * Gera checklist de documentos dinâmico baseado no perfil fiscal do cliente
 * Organizado nas 8 categorias oficiais da Receita Federal
 */

export interface PerfilFiscal {
  salario: boolean;
  proLabore: boolean;
  aluguel: boolean;
  bolsa: boolean;
  despesasMedicas: boolean;
  educacao: boolean;
  dependentes: boolean;
  previdencia: boolean;
  autonomo: boolean;
  heranca: boolean;
  bensImoveis: boolean;
}

export const PERFIL_LABELS: Record<keyof PerfilFiscal, string> = {
  salario: 'Recebeu salário de emprego com carteira assinada?',
  proLabore: 'Recebeu pró-labore (sócio de empresa)?',
  aluguel: 'Recebeu rendimentos de aluguel?',
  bolsa: 'Realizou operações na Bolsa de Valores?',
  despesasMedicas: 'Teve despesas médicas (consultas, exames, plano de saúde)?',
  educacao: 'Pagou escola/faculdade para você ou dependentes?',
  dependentes: 'Tem dependentes (filhos, cônjuge, pais)?',
  previdencia: 'Contribui para Previdência Privada (PGBL/VGBL)?',
  autonomo: 'É autônomo/MEI (emite nota fiscal por serviços)?',
  heranca: 'Recebeu herança, doações ou ganhos de capital?',
  bensImoveis: 'Possui imóvel, veículo, investimentos ou outros bens?',
};

export const PERFIL_DESCRICOES: Record<keyof PerfilFiscal, string> = {
  salario: 'Emprego CLT, estágio remunerado ou trabalho temporário',
  proLabore: 'Retiradas como sócio ou administrador de empresa',
  aluguel: 'Imóveis alugados para terceiros',
  bolsa: 'Ações, FIIs, ETFs, opções, day-trade',
  despesasMedicas: 'Médico, dentista, psicólogo, hospital, plano de saúde',
  educacao: 'Escola, faculdade, pós-graduação, técnico',
  dependentes: 'Filhos menores, cônjuge sem renda, pais idosos',
  previdencia: 'PGBL permite dedução de até 12% da renda',
  autonomo: 'Profissional liberal, MEI, prestador de serviços',
  heranca: 'Herança, doação recebida, venda de imóvel ou veículo',
  bensImoveis: 'Imóveis, veículos, aplicações financeiras, criptomoedas',
};

/**
 * 8 Categorias oficiais da Receita Federal para organização de documentos
 */
export const CATEGORIAS_RF = [
  'documentos_pessoais',
  'rendimentos_tributaveis',
  'rendimentos_isentos',
  'deducoes_saude',
  'deducoes_educacao',
  'deducoes_previdencia',
  'bens_direitos',
  'dividas_onus',
] as const;

export type CategoriaRF = typeof CATEGORIAS_RF[number];

export const CATEGORIA_LABELS: Record<CategoriaRF, string> = {
  documentos_pessoais: 'Documentos Pessoais',
  rendimentos_tributaveis: 'Rendimentos Tributáveis',
  rendimentos_isentos: 'Rendimentos Isentos e Não Tributáveis',
  deducoes_saude: 'Deduções – Saúde',
  deducoes_educacao: 'Deduções – Educação',
  deducoes_previdencia: 'Deduções – Previdência e Pensão',
  bens_direitos: 'Bens e Direitos',
  dividas_onus: 'Dívidas e Ônus Reais',
};

interface ChecklistItem {
  nome_documento: string;
  categoria: CategoriaRF;
  obrigatorio: boolean;
  tooltip: string;
}

const CHECKLIST_MAP: Record<keyof PerfilFiscal, ChecklistItem[]> = {
  salario: [
    { nome_documento: 'Informe de Rendimentos do Empregador', categoria: 'rendimentos_tributaveis', obrigatorio: true, tooltip: 'Documento emitido pela empresa onde trabalha, com valores de salário, IRRF retido e contribuições. Formatos aceitos: PDF, JPG, PNG.' },
    { nome_documento: 'Comprovante de 13º Salário', categoria: 'rendimentos_tributaveis', obrigatorio: false, tooltip: 'Holerite ou comprovante do 13º salário recebido no ano. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Comprovante de Férias Pagas', categoria: 'rendimentos_tributaveis', obrigatorio: false, tooltip: 'Recibo de férias com valores bruto, descontos e líquido. Aceita: PDF, JPG, PNG.' },
  ],
  proLabore: [
    { nome_documento: 'Informe de Rendimentos da Empresa (Pró-labore)', categoria: 'rendimentos_tributaveis', obrigatorio: true, tooltip: 'Informe emitido pela empresa da qual é sócio, com valores de pró-labore e IR retido. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Comprovante de Distribuição de Lucros', categoria: 'rendimentos_isentos', obrigatorio: false, tooltip: 'Documento comprovando lucros distribuídos pela empresa (isentos de IR). Aceita: PDF, JPG, PNG.' },
  ],
  aluguel: [
    { nome_documento: 'Recibos de Aluguéis Recebidos', categoria: 'rendimentos_tributaveis', obrigatorio: true, tooltip: 'Recibos mensais dos aluguéis recebidos ao longo do ano. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Contrato de Locação', categoria: 'rendimentos_tributaveis', obrigatorio: false, tooltip: 'Contrato assinado com o inquilino. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'CPF/CNPJ do Locatário', categoria: 'rendimentos_tributaveis', obrigatorio: true, tooltip: 'Número do CPF ou CNPJ do inquilino que paga o aluguel. Aceita: qualquer documento com o dado.' },
    { nome_documento: 'Comprovantes de IPTU/Condomínio Pagos', categoria: 'rendimentos_tributaveis', obrigatorio: false, tooltip: 'Comprovantes de IPTU e condomínio pagos pelo proprietário. Aceita: PDF, JPG, PNG.' },
  ],
  bolsa: [
    { nome_documento: 'Notas de Corretagem', categoria: 'rendimentos_tributaveis', obrigatorio: true, tooltip: 'Notas de corretagem das operações realizadas na bolsa de valores durante o ano. Aceita: PDF.' },
    { nome_documento: 'Informe de Rendimentos da Corretora', categoria: 'rendimentos_tributaveis', obrigatorio: true, tooltip: 'Informe anual emitido pela corretora com rendimentos, custódia e proventos. Aceita: PDF.' },
    { nome_documento: 'DARFs de Renda Variável Pagos', categoria: 'rendimentos_tributaveis', obrigatorio: false, tooltip: 'Guias DARF de imposto sobre ganho em renda variável pagas ao longo do ano. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Extrato de Posição de Ações/FIIs em 31/12', categoria: 'bens_direitos', obrigatorio: true, tooltip: 'Extrato mostrando a posição (quantidade e valor) de ações e FIIs na data de 31/12. Aceita: PDF.' },
    { nome_documento: 'Informe de Dividendos Recebidos', categoria: 'rendimentos_isentos', obrigatorio: false, tooltip: 'Relatório de dividendos e JCP recebidos durante o ano. Aceita: PDF.' },
  ],
  despesasMedicas: [
    { nome_documento: 'Recibos de Consultas Médicas', categoria: 'deducoes_saude', obrigatorio: true, tooltip: 'Recibos de consultas com médicos, contendo nome, CPF/CNPJ do profissional e valor. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Recibos de Exames e Procedimentos', categoria: 'deducoes_saude', obrigatorio: true, tooltip: 'Notas fiscais ou recibos de exames laboratoriais e procedimentos médicos. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Informe do Plano de Saúde', categoria: 'deducoes_saude', obrigatorio: true, tooltip: 'Informe anual de pagamentos emitido pela operadora do plano de saúde. Aceita: PDF.' },
    { nome_documento: 'Recibos de Dentista/Ortodontia', categoria: 'deducoes_saude', obrigatorio: false, tooltip: 'Recibos de tratamentos odontológicos com CPF/CNPJ do profissional. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Recibos de Psicólogo/Fonoaudiólogo', categoria: 'deducoes_saude', obrigatorio: false, tooltip: 'Recibos de sessões com psicólogo, fonoaudiólogo ou terapeuta. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Notas Fiscais de Hospitais/Clínicas', categoria: 'deducoes_saude', obrigatorio: false, tooltip: 'Notas fiscais de internações, cirurgias ou procedimentos hospitalares. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Comprovantes de Aparelhos Ortopédicos/Próteses', categoria: 'deducoes_saude', obrigatorio: false, tooltip: 'Recibos de aparelhos ortopédicos, próteses e similares prescritos por médico. Aceita: PDF, JPG, PNG.' },
  ],
  educacao: [
    { nome_documento: 'Comprovantes de Pagamento de Educação', categoria: 'deducoes_educacao', obrigatorio: true, tooltip: 'Boletos pagos ou recibos de mensalidades escolares/universitárias. Limite de R$ 3.561,50 por pessoa. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'CNPJ e Nome da Instituição de Ensino', categoria: 'deducoes_educacao', obrigatorio: true, tooltip: 'Dados da instituição (CNPJ, razão social). Pode estar no próprio boleto. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Boletos/Notas Fiscais de Mensalidades', categoria: 'deducoes_educacao', obrigatorio: false, tooltip: 'Boletos ou notas fiscais mensais pagas à instituição de ensino. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Comprovante de Pós-graduação/MBA', categoria: 'deducoes_educacao', obrigatorio: false, tooltip: 'Comprovantes de pagamento de cursos de pós-graduação, MBA ou especialização. Aceita: PDF, JPG, PNG.' },
  ],
  dependentes: [
    { nome_documento: 'CPF dos Dependentes', categoria: 'documentos_pessoais', obrigatorio: true, tooltip: 'CPF de cada dependente declarado. A Receita Federal exige CPF mesmo para menores. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Certidão de Nascimento dos Filhos', categoria: 'documentos_pessoais', obrigatorio: false, tooltip: 'Certidão de nascimento dos filhos menores incluídos como dependentes. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Certidão de Casamento/União Estável', categoria: 'documentos_pessoais', obrigatorio: false, tooltip: 'Certidão de casamento ou declaração de união estável para cônjuge dependente. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Informe de Rendimentos do Dependente (se houver)', categoria: 'rendimentos_tributaveis', obrigatorio: false, tooltip: 'Caso o dependente tenha rendimentos próprios, inclua o informe aqui. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Comprovante de Guarda Judicial (se aplicável)', categoria: 'documentos_pessoais', obrigatorio: false, tooltip: 'Documento judicial que comprova a guarda do dependente, quando aplicável. Aceita: PDF, JPG, PNG.' },
  ],
  previdencia: [
    { nome_documento: 'Informe de Contribuições PGBL', categoria: 'deducoes_previdencia', obrigatorio: true, tooltip: 'Informe anual da entidade de previdência com valores contribuídos ao PGBL. Dedutível até 12% da renda bruta. Aceita: PDF.' },
    { nome_documento: 'Informe de Contribuições VGBL', categoria: 'deducoes_previdencia', obrigatorio: false, tooltip: 'Informe anual de contribuições ao VGBL. Não é dedutível, mas deve ser declarado como bem. Aceita: PDF.' },
    { nome_documento: 'Comprovante de Contribuição ao INSS', categoria: 'deducoes_previdencia', obrigatorio: false, tooltip: 'Carnês ou comprovantes de contribuição ao INSS como autônomo ou facultativo. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Comprovante de Pensão Alimentícia Judicial', categoria: 'deducoes_previdencia', obrigatorio: false, tooltip: 'Comprovantes de pagamento de pensão alimentícia determinada judicialmente. Só é dedutível se judicial. Aceita: PDF, JPG, PNG.' },
  ],
  autonomo: [
    { nome_documento: 'Carnê-leão (DARFs Pagos)', categoria: 'rendimentos_tributaveis', obrigatorio: true, tooltip: 'Guias DARF do carnê-leão pagas mensalmente sobre rendimentos de pessoa física. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Comprovantes de Despesas Dedutíveis (Livro-caixa)', categoria: 'rendimentos_tributaveis', obrigatorio: false, tooltip: 'Notas fiscais e recibos de despesas necessárias à atividade profissional (aluguel do consultório, materiais, etc.). Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Notas Fiscais de Serviços Prestados', categoria: 'rendimentos_tributaveis', obrigatorio: false, tooltip: 'Notas fiscais emitidas por serviços prestados como autônomo durante o ano. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Declaração Anual do MEI (DASN-SIMEI)', categoria: 'rendimentos_tributaveis', obrigatorio: false, tooltip: 'Declaração Anual do Simples Nacional para MEI, se aplicável. Aceita: PDF.' },
  ],
  heranca: [
    { nome_documento: 'Escritura ou Formal de Partilha', categoria: 'bens_direitos', obrigatorio: true, tooltip: 'Documento judicial ou em cartório que formaliza a divisão de bens recebidos por herança. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Documentos de Compra e Venda', categoria: 'bens_direitos', obrigatorio: false, tooltip: 'Contratos ou escrituras de compra e venda de bens (imóveis, veículos). Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'GCAP (Programa de Ganho de Capital)', categoria: 'bens_direitos', obrigatorio: false, tooltip: 'Arquivo gerado pelo programa GCAP da Receita Federal para apuração de ganho de capital. Aceita: PDF.' },
    { nome_documento: 'Comprovante de Doação Recebida', categoria: 'rendimentos_isentos', obrigatorio: false, tooltip: 'Documento que comprova doação recebida, com valor e dados do doador. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Comprovante de ITCMD Pago', categoria: 'bens_direitos', obrigatorio: false, tooltip: 'Guia de recolhimento do Imposto sobre Transmissão Causa Mortis e Doação. Aceita: PDF, JPG, PNG.' },
  ],
  bensImoveis: [
    { nome_documento: 'Escritura/Contrato de Compra de Imóveis', categoria: 'bens_direitos', obrigatorio: true, tooltip: 'Escritura ou contrato de compra e venda de imóveis que possui. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'CRLV de Veículos', categoria: 'bens_direitos', obrigatorio: true, tooltip: 'Certificado de Registro e Licenciamento de Veículo (CRLV) atualizado. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Extratos de Investimentos/Aplicações em 31/12', categoria: 'bens_direitos', obrigatorio: true, tooltip: 'Extratos de posição de investimentos (CDB, LCI, LCA, fundos) na data de 31/12. Aceita: PDF.' },
    { nome_documento: 'Informe de Saldo em Conta Corrente/Poupança', categoria: 'bens_direitos', obrigatorio: true, tooltip: 'Informe bancário anual com saldos em 31/12 do ano anterior e do ano-base. Aceita: PDF.' },
    { nome_documento: 'Informe de Criptomoedas/Ativos Digitais', categoria: 'bens_direitos', obrigatorio: false, tooltip: 'Relatório de posição de criptomoedas e ativos digitais em 31/12. Aceita: PDF, JPG, PNG.' },
    { nome_documento: 'Contrato de Financiamento Imobiliário', categoria: 'dividas_onus', obrigatorio: false, tooltip: 'Contrato e extrato anual do financiamento imobiliário com saldo devedor. Aceita: PDF.' },
    { nome_documento: 'Contrato de Financiamento de Veículo', categoria: 'dividas_onus', obrigatorio: false, tooltip: 'Contrato e extrato do financiamento de veículo com parcelas pagas e saldo. Aceita: PDF.' },
    { nome_documento: 'Comprovante de Consórcio (parcelas pagas)', categoria: 'dividas_onus', obrigatorio: false, tooltip: 'Extrato do consórcio com parcelas pagas no ano e valor total. Aceita: PDF.' },
    { nome_documento: 'Comprovante de Empréstimos Bancários', categoria: 'dividas_onus', obrigatorio: false, tooltip: 'Informe bancário com saldo devedor de empréstimos pessoais em 31/12. Aceita: PDF.' },
  ],
};

// Documentos base que todos precisam
const CHECKLIST_BASE: ChecklistItem[] = [
  { nome_documento: 'Documento de Identidade (RG/CNH)', categoria: 'documentos_pessoais', obrigatorio: true, tooltip: 'Documento oficial com foto: RG, CNH ou passaporte. Aceita: PDF, JPG, PNG.' },
  { nome_documento: 'CPF do Titular', categoria: 'documentos_pessoais', obrigatorio: true, tooltip: 'Comprovante do CPF do declarante (cartão CPF, CNH ou site da Receita). Aceita: PDF, JPG, PNG.' },
  { nome_documento: 'Comprovante de Endereço Atualizado', categoria: 'documentos_pessoais', obrigatorio: true, tooltip: 'Conta de luz, água, telefone ou correspondência bancária dos últimos 3 meses. Aceita: PDF, JPG, PNG.' },
  { nome_documento: 'Título de Eleitor (opcional)', categoria: 'documentos_pessoais', obrigatorio: false, tooltip: 'Título de eleitor para preenchimento da declaração. Opcional. Aceita: PDF, JPG, PNG.' },
  { nome_documento: 'Última Declaração Entregue (Recibo)', categoria: 'documentos_pessoais', obrigatorio: false, tooltip: 'Recibo de entrega da declaração do ano anterior. Facilita o preenchimento. Aceita: PDF.' },
];

/**
 * Tooltips lookup por nome do documento
 */
export const DOCUMENTO_TOOLTIPS: Record<string, string> = {};

// Pre-populate tooltips
[...CHECKLIST_BASE, ...Object.values(CHECKLIST_MAP).flat()].forEach(item => {
  DOCUMENTO_TOOLTIPS[item.nome_documento] = item.tooltip;
});

export function gerarChecklistPorPerfil(perfil: PerfilFiscal): ChecklistItem[] {
  const items = [...CHECKLIST_BASE];
  const seen = new Set(items.map(i => i.nome_documento));

  for (const [key, ativo] of Object.entries(perfil)) {
    if (ativo && CHECKLIST_MAP[key as keyof PerfilFiscal]) {
      for (const item of CHECKLIST_MAP[key as keyof PerfilFiscal]) {
        if (!seen.has(item.nome_documento)) {
          items.push(item);
          seen.add(item.nome_documento);
        }
      }
    }
  }

  return items;
}

export const DEFAULT_PERFIL: PerfilFiscal = {
  salario: false,
  proLabore: false,
  aluguel: false,
  bolsa: false,
  despesasMedicas: false,
  educacao: false,
  dependentes: false,
  previdencia: false,
  autonomo: false,
  heranca: false,
  bensImoveis: false,
};
