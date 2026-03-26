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
}

const CHECKLIST_MAP: Record<keyof PerfilFiscal, ChecklistItem[]> = {
  salario: [
    { nome_documento: 'Informe de Rendimentos do Empregador', categoria: 'rendimentos_tributaveis', obrigatorio: true },
    { nome_documento: 'Comprovante de 13º Salário', categoria: 'rendimentos_tributaveis', obrigatorio: false },
    { nome_documento: 'Comprovante de Férias Pagas', categoria: 'rendimentos_tributaveis', obrigatorio: false },
  ],
  proLabore: [
    { nome_documento: 'Informe de Rendimentos da Empresa (Pró-labore)', categoria: 'rendimentos_tributaveis', obrigatorio: true },
    { nome_documento: 'Comprovante de Distribuição de Lucros', categoria: 'rendimentos_isentos', obrigatorio: false },
  ],
  aluguel: [
    { nome_documento: 'Recibos de Aluguéis Recebidos', categoria: 'rendimentos_tributaveis', obrigatorio: true },
    { nome_documento: 'Contrato de Locação', categoria: 'rendimentos_tributaveis', obrigatorio: false },
    { nome_documento: 'CPF/CNPJ do Locatário', categoria: 'rendimentos_tributaveis', obrigatorio: true },
    { nome_documento: 'Comprovantes de IPTU/Condomínio Pagos', categoria: 'rendimentos_tributaveis', obrigatorio: false },
  ],
  bolsa: [
    { nome_documento: 'Notas de Corretagem', categoria: 'rendimentos_tributaveis', obrigatorio: true },
    { nome_documento: 'Informe de Rendimentos da Corretora', categoria: 'rendimentos_tributaveis', obrigatorio: true },
    { nome_documento: 'DARFs de Renda Variável Pagos', categoria: 'rendimentos_tributaveis', obrigatorio: false },
    { nome_documento: 'Extrato de Posição de Ações/FIIs em 31/12', categoria: 'bens_direitos', obrigatorio: true },
    { nome_documento: 'Informe de Dividendos Recebidos', categoria: 'rendimentos_isentos', obrigatorio: false },
  ],
  despesasMedicas: [
    { nome_documento: 'Recibos de Consultas Médicas', categoria: 'deducoes_saude', obrigatorio: true },
    { nome_documento: 'Recibos de Exames e Procedimentos', categoria: 'deducoes_saude', obrigatorio: true },
    { nome_documento: 'Informe do Plano de Saúde', categoria: 'deducoes_saude', obrigatorio: true },
    { nome_documento: 'Recibos de Dentista/Ortodontia', categoria: 'deducoes_saude', obrigatorio: false },
    { nome_documento: 'Recibos de Psicólogo/Fonoaudiólogo', categoria: 'deducoes_saude', obrigatorio: false },
    { nome_documento: 'Notas Fiscais de Hospitais/Clínicas', categoria: 'deducoes_saude', obrigatorio: false },
    { nome_documento: 'Comprovantes de Aparelhos Ortopédicos/Próteses', categoria: 'deducoes_saude', obrigatorio: false },
  ],
  educacao: [
    { nome_documento: 'Comprovantes de Pagamento de Educação', categoria: 'deducoes_educacao', obrigatorio: true },
    { nome_documento: 'CNPJ e Nome da Instituição de Ensino', categoria: 'deducoes_educacao', obrigatorio: true },
    { nome_documento: 'Boletos/Notas Fiscais de Mensalidades', categoria: 'deducoes_educacao', obrigatorio: false },
    { nome_documento: 'Comprovante de Pós-graduação/MBA', categoria: 'deducoes_educacao', obrigatorio: false },
  ],
  dependentes: [
    { nome_documento: 'CPF dos Dependentes', categoria: 'documentos_pessoais', obrigatorio: true },
    { nome_documento: 'Certidão de Nascimento dos Filhos', categoria: 'documentos_pessoais', obrigatorio: false },
    { nome_documento: 'Certidão de Casamento/União Estável', categoria: 'documentos_pessoais', obrigatorio: false },
    { nome_documento: 'Informe de Rendimentos do Dependente (se houver)', categoria: 'rendimentos_tributaveis', obrigatorio: false },
    { nome_documento: 'Comprovante de Guarda Judicial (se aplicável)', categoria: 'documentos_pessoais', obrigatorio: false },
  ],
  previdencia: [
    { nome_documento: 'Informe de Contribuições PGBL', categoria: 'deducoes_previdencia', obrigatorio: true },
    { nome_documento: 'Informe de Contribuições VGBL', categoria: 'deducoes_previdencia', obrigatorio: false },
    { nome_documento: 'Comprovante de Contribuição ao INSS', categoria: 'deducoes_previdencia', obrigatorio: false },
    { nome_documento: 'Comprovante de Pensão Alimentícia Judicial', categoria: 'deducoes_previdencia', obrigatorio: false },
  ],
  autonomo: [
    { nome_documento: 'Carnê-leão (DARFs Pagos)', categoria: 'rendimentos_tributaveis', obrigatorio: true },
    { nome_documento: 'Comprovantes de Despesas Dedutíveis (Livro-caixa)', categoria: 'rendimentos_tributaveis', obrigatorio: false },
    { nome_documento: 'Notas Fiscais de Serviços Prestados', categoria: 'rendimentos_tributaveis', obrigatorio: false },
    { nome_documento: 'Declaração Anual do MEI (DASN-SIMEI)', categoria: 'rendimentos_tributaveis', obrigatorio: false },
  ],
  heranca: [
    { nome_documento: 'Escritura ou Formal de Partilha', categoria: 'bens_direitos', obrigatorio: true },
    { nome_documento: 'Documentos de Compra e Venda', categoria: 'bens_direitos', obrigatorio: false },
    { nome_documento: 'GCAP (Programa de Ganho de Capital)', categoria: 'bens_direitos', obrigatorio: false },
    { nome_documento: 'Comprovante de Doação Recebida', categoria: 'rendimentos_isentos', obrigatorio: false },
    { nome_documento: 'Comprovante de ITCMD Pago', categoria: 'bens_direitos', obrigatorio: false },
  ],
  bensImoveis: [
    { nome_documento: 'Escritura/Contrato de Compra de Imóveis', categoria: 'bens_direitos', obrigatorio: true },
    { nome_documento: 'CRLV de Veículos', categoria: 'bens_direitos', obrigatorio: true },
    { nome_documento: 'Extratos de Investimentos/Aplicações em 31/12', categoria: 'bens_direitos', obrigatorio: true },
    { nome_documento: 'Informe de Saldo em Conta Corrente/Poupança', categoria: 'bens_direitos', obrigatorio: true },
    { nome_documento: 'Informe de Criptomoedas/Ativos Digitais', categoria: 'bens_direitos', obrigatorio: false },
    { nome_documento: 'Contrato de Financiamento Imobiliário', categoria: 'dividas_onus', obrigatorio: false },
    { nome_documento: 'Contrato de Financiamento de Veículo', categoria: 'dividas_onus', obrigatorio: false },
    { nome_documento: 'Comprovante de Consórcio (parcelas pagas)', categoria: 'dividas_onus', obrigatorio: false },
    { nome_documento: 'Comprovante de Empréstimos Bancários', categoria: 'dividas_onus', obrigatorio: false },
  ],
};

// Documentos base que todos precisam
const CHECKLIST_BASE: ChecklistItem[] = [
  { nome_documento: 'Documento de Identidade (RG/CNH)', categoria: 'documentos_pessoais', obrigatorio: true },
  { nome_documento: 'CPF do Titular', categoria: 'documentos_pessoais', obrigatorio: true },
  { nome_documento: 'Comprovante de Endereço Atualizado', categoria: 'documentos_pessoais', obrigatorio: true },
  { nome_documento: 'Título de Eleitor (opcional)', categoria: 'documentos_pessoais', obrigatorio: false },
  { nome_documento: 'Última Declaração Entregue (Recibo)', categoria: 'documentos_pessoais', obrigatorio: false },
  { nome_documento: 'Informe de Rendimentos Bancários', categoria: 'rendimentos_tributaveis', obrigatorio: true },
  { nome_documento: 'Informe de Rendimentos de Poupança', categoria: 'rendimentos_isentos', obrigatorio: false },
  { nome_documento: 'Comprovante de Saque do FGTS', categoria: 'rendimentos_isentos', obrigatorio: false },
];

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
