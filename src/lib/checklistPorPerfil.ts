/**
 * Gera checklist de documentos dinâmico baseado no perfil fiscal do cliente
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

interface ChecklistItem {
  nome_documento: string;
  categoria: string;
  obrigatorio: boolean;
}

const CHECKLIST_MAP: Record<keyof PerfilFiscal, ChecklistItem[]> = {
  salario: [
    { nome_documento: 'Informe de Rendimentos do Empregador', categoria: 'rendimentos', obrigatorio: true },
  ],
  proLabore: [
    { nome_documento: 'Informe de Rendimentos da Empresa (Pró-labore)', categoria: 'rendimentos', obrigatorio: true },
  ],
  aluguel: [
    { nome_documento: 'Recibos de Aluguéis Recebidos', categoria: 'rendimentos', obrigatorio: true },
    { nome_documento: 'Contrato de Locação', categoria: 'rendimentos', obrigatorio: false },
    { nome_documento: 'CPF/CNPJ do Locatário', categoria: 'rendimentos', obrigatorio: true },
  ],
  bolsa: [
    { nome_documento: 'Notas de Corretagem', categoria: 'rendimentos', obrigatorio: true },
    { nome_documento: 'Informe de Rendimentos da Corretora', categoria: 'rendimentos', obrigatorio: true },
    { nome_documento: 'DARFs de Renda Variável Pagos', categoria: 'rendimentos', obrigatorio: false },
  ],
  despesasMedicas: [
    { nome_documento: 'Recibos de Consultas e Exames Médicos', categoria: 'deducoes', obrigatorio: true },
    { nome_documento: 'Informe do Plano de Saúde', categoria: 'deducoes', obrigatorio: true },
    { nome_documento: 'Notas Fiscais de Hospitais/Clínicas', categoria: 'deducoes', obrigatorio: false },
  ],
  educacao: [
    { nome_documento: 'Comprovantes de Pagamento de Educação', categoria: 'deducoes', obrigatorio: true },
    { nome_documento: 'CNPJ e Nome da Instituição de Ensino', categoria: 'deducoes', obrigatorio: true },
  ],
  dependentes: [
    { nome_documento: 'CPF dos Dependentes', categoria: 'outros', obrigatorio: true },
    { nome_documento: 'Certidão de Nascimento/Casamento', categoria: 'outros', obrigatorio: false },
  ],
  previdencia: [
    { nome_documento: 'Informe de Contribuições PGBL/VGBL', categoria: 'deducoes', obrigatorio: true },
  ],
  autonomo: [
    { nome_documento: 'Carnê-leão (DARFs Pagos)', categoria: 'rendimentos', obrigatorio: true },
    { nome_documento: 'Comprovantes de Despesas Dedutíveis (Livro-caixa)', categoria: 'rendimentos', obrigatorio: false },
  ],
  heranca: [
    { nome_documento: 'Escritura ou Formal de Partilha', categoria: 'bens_direitos', obrigatorio: true },
    { nome_documento: 'Documentos de Compra e Venda', categoria: 'bens_direitos', obrigatorio: false },
    { nome_documento: 'GCAP (Programa de Ganho de Capital)', categoria: 'bens_direitos', obrigatorio: false },
  ],
  bensImoveis: [
    { nome_documento: 'Escritura/Contrato de Imóveis', categoria: 'bens_direitos', obrigatorio: true },
    { nome_documento: 'CRLV de Veículos', categoria: 'bens_direitos', obrigatorio: true },
    { nome_documento: 'Extratos de Investimentos/Aplicações', categoria: 'bens_direitos', obrigatorio: false },
  ],
};

// Documentos base que todos precisam
const CHECKLIST_BASE: ChecklistItem[] = [
  { nome_documento: 'Comprovante de Endereço Atualizado', categoria: 'outros', obrigatorio: true },
  { nome_documento: 'Documento de Identidade (RG/CNH)', categoria: 'outros', obrigatorio: true },
  { nome_documento: 'Informe de Rendimentos Bancários', categoria: 'rendimentos', obrigatorio: true },
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
