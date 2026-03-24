/**
 * Motor de Cálculo do IRPF 2026
 * Tabela progressiva e dedução simplificada
 */

// Faixas da tabela progressiva IRPF 2026
const FAIXAS = [
  { limite: 28559.70, aliquota: 0, deducao: 0 },
  { limite: 33919.80, aliquota: 0.075, deducao: 2141.98 },
  { limite: 45012.60, aliquota: 0.15, deducao: 4685.96 },
  { limite: 55976.16, aliquota: 0.225, deducao: 8060.90 },
  { limite: Infinity, aliquota: 0.275, deducao: 10858.71 },
];

// Constantes 2026
export const DESCONTO_SIMPLIFICADO_PCT = 0.20;
export const TETO_DESCONTO_SIMPLIFICADO = 16754.34;
export const DEDUCAO_POR_DEPENDENTE = 2275.08;
export const TETO_EDUCACAO_POR_PESSOA = 3561.50;
export const TETO_PGBL_PCT = 0.12; // 12% da renda bruta

export interface DadosCalculo {
  rendimentosTributaveis: number;
  inss: number;
  dependentes: number;
  despesasMedicas: number;
  despesasEducacao: number;
  educacaoPessoas: number; // número de pessoas com despesa educação
  previdenciaPrivadaPGBL: number;
  pensaoAlimenticia: number;
  livroCaixa: number;
  outrasDeducoes: number;
  impostoRetido: number;
}

export interface ResultadoCalculo {
  baseCalculo: number;
  impostoDevido: number;
  impostoRetido: number;
  resultado: number; // positivo = restituição, negativo = a pagar
  tipoResultado: 'restituicao' | 'pagamento' | 'nenhum';
  totalDeducoes: number;
}

export interface ComparativoIR {
  simplificada: ResultadoCalculo;
  completa: ResultadoCalculo;
  melhorOpcao: 'simplificada' | 'completa';
  economia: number;
}

function calcularImpostoProgressivo(baseCalculo: number): number {
  if (baseCalculo <= 0) return 0;
  for (const faixa of FAIXAS) {
    if (baseCalculo <= faixa.limite) {
      return Math.max(0, baseCalculo * faixa.aliquota - faixa.deducao);
    }
  }
  const ultima = FAIXAS[FAIXAS.length - 1];
  return baseCalculo * ultima.aliquota - ultima.deducao;
}

export function calcularSimplificada(dados: DadosCalculo): ResultadoCalculo {
  const desconto = Math.min(
    dados.rendimentosTributaveis * DESCONTO_SIMPLIFICADO_PCT,
    TETO_DESCONTO_SIMPLIFICADO
  );
  const baseCalculo = Math.max(0, dados.rendimentosTributaveis - desconto);
  const impostoDevido = calcularImpostoProgressivo(baseCalculo);
  const resultado = dados.impostoRetido - impostoDevido;

  return {
    baseCalculo,
    impostoDevido,
    impostoRetido: dados.impostoRetido,
    resultado,
    tipoResultado: resultado > 0 ? 'restituicao' : resultado < 0 ? 'pagamento' : 'nenhum',
    totalDeducoes: desconto,
  };
}

export function calcularCompleta(dados: DadosCalculo): ResultadoCalculo {
  const deducaoDependentes = dados.dependentes * DEDUCAO_POR_DEPENDENTE;
  const educacaoLimitada = Math.min(
    dados.despesasEducacao,
    dados.educacaoPessoas * TETO_EDUCACAO_POR_PESSOA
  );
  const pgblLimitado = Math.min(
    dados.previdenciaPrivadaPGBL,
    dados.rendimentosTributaveis * TETO_PGBL_PCT
  );

  const totalDeducoes =
    dados.inss +
    deducaoDependentes +
    dados.despesasMedicas +
    educacaoLimitada +
    pgblLimitado +
    dados.pensaoAlimenticia +
    dados.livroCaixa +
    dados.outrasDeducoes;

  const baseCalculo = Math.max(0, dados.rendimentosTributaveis - totalDeducoes);
  const impostoDevido = calcularImpostoProgressivo(baseCalculo);
  const resultado = dados.impostoRetido - impostoDevido;

  return {
    baseCalculo,
    impostoDevido,
    impostoRetido: dados.impostoRetido,
    resultado,
    tipoResultado: resultado > 0 ? 'restituicao' : resultado < 0 ? 'pagamento' : 'nenhum',
    totalDeducoes,
  };
}

export function calcularComparativo(dados: DadosCalculo): ComparativoIR {
  const simplificada = calcularSimplificada(dados);
  const completa = calcularCompleta(dados);

  // A melhor opção é a que resulta em mais restituição (ou menor pagamento)
  const melhorOpcao = completa.resultado >= simplificada.resultado ? 'completa' : 'simplificada';
  const economia = Math.abs(completa.resultado - simplificada.resultado);

  return { simplificada, completa, melhorOpcao, economia };
}
