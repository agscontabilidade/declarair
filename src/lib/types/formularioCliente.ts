export interface DadosCadastrais {
  data_nascimento: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  numero_titulo_eleitor: string;
}

export interface Dependente {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  grau_parentesco: 'filho' | 'conjuge' | 'pai' | 'mae' | 'outro';
}

export interface Alimentando {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
}

export interface RendimentoTributavel {
  id: string;
  empresa: string;
  cnpj: string;
  valor_total: number;
}

export interface RendimentoIsento {
  id: string;
  tipo: string;
  valor: number;
}

export interface RendimentoFinanceiro {
  id: string;
  instituicao: string;
  tipo: string;
  valor: number;
}

export interface AluguelRecebido {
  id: string;
  endereco: string;
  locatario_cpf: string;
  valor_mensal: number;
  meses_recebidos: number;
}

export interface DespesaMedica {
  id: string;
  prestador: string;
  cpf_cnpj: string;
  tipo: string;
  valor: number;
}

export interface PlanoSaude {
  id: string;
  operadora: string;
  cnpj: string;
  valor_total: number;
}

export interface DespesaEducacao {
  id: string;
  instituicao: string;
  cnpj: string;
  tipo: 'fundamental' | 'medio' | 'superior' | 'tecnico';
  beneficiario: string;
  valor: number;
}

export interface PrevidenciaPrivada {
  id: string;
  instituicao: string;
  cnpj: string;
  tipo: 'PGBL' | 'VGBL';
  valor_contribuido: number;
}

export interface PensaoPaga {
  id: string;
  beneficiario: string;
  cpf: string;
  valor_total: number;
}

export interface BemDireito {
  id: string;
  tipo: string;
  descricao: string;
  valor_2024: number;
  valor_2025: number;
  operacao_2025?: {
    tipo: 'compra' | 'venda' | 'nenhuma';
    data?: string;
    valor?: number;
    contraparte_nome?: string;
    contraparte_cpf_cnpj?: string;
    forma_pagamento?: string;
  };
  financiamento?: {
    banco: string;
    valor_financiado: number;
    valor_pago_2025: number;
  };
}

export interface AcoesBolsa {
  id: string;
  corretora: string;
  cnpj: string;
  movimentacao_total: number;
  ganho_perda: number;
}

export interface Criptoativo {
  id: string;
  exchange: string;
  tipo: string;
  movimentacao_total: number;
  ganho_perda: number;
}

export interface Divida {
  id: string;
  tipo: string;
  credor: string;
  cpf_cnpj_credor: string;
  saldo_2024: number;
  saldo_2025: number;
  valor_pago_2025: number;
}

export interface FormularioCompleto {
  dados_cadastrais: DadosCadastrais;
  dependentes: Dependente[];
  alimentandos: Alimentando[];
  paga_pensao: boolean;
  rendimentos: {
    tributaveis: RendimentoTributavel[];
    isentos: RendimentoIsento[];
    financeiros: RendimentoFinanceiro[];
    alugueis: AluguelRecebido[];
  };
  despesas: {
    medicas: DespesaMedica[];
    planos_saude: PlanoSaude[];
    educacao: DespesaEducacao[];
    previdencia_privada: PrevidenciaPrivada[];
    pensao_paga: PensaoPaga[];
  };
  bens_direitos: BemDireito[];
  investimentos: {
    acoes_bolsa: AcoesBolsa[];
    criptoativos: Criptoativo[];
  };
  dividas: Divida[];
}
