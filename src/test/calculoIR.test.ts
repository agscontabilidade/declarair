import { describe, it, expect } from 'vitest';
import {
  calcularSimplificada,
  calcularCompleta,
  calcularComparativo,
  DESCONTO_SIMPLIFICADO_PCT,
  TETO_DESCONTO_SIMPLIFICADO,
  DEDUCAO_POR_DEPENDENTE,
  TETO_EDUCACAO_POR_PESSOA,
  TETO_PGBL_PCT,
  type DadosCalculo,
} from '@/lib/calculoIR';

const dadosBase: DadosCalculo = {
  rendimentosTributaveis: 0,
  inss: 0,
  dependentes: 0,
  despesasMedicas: 0,
  despesasEducacao: 0,
  educacaoPessoas: 0,
  previdenciaPrivadaPGBL: 0,
  pensaoAlimenticia: 0,
  livroCaixa: 0,
  outrasDeducoes: 0,
  impostoRetido: 0,
};

function dados(overrides: Partial<DadosCalculo>): DadosCalculo {
  return { ...dadosBase, ...overrides };
}

// ── Constantes ──────────────────────────────────────────
describe('Constantes IRPF 2026', () => {
  it('desconto simplificado = 20%', () => {
    expect(DESCONTO_SIMPLIFICADO_PCT).toBe(0.20);
  });
  it('teto desconto simplificado = R$ 16.754,34', () => {
    expect(TETO_DESCONTO_SIMPLIFICADO).toBe(16754.34);
  });
  it('dedução por dependente = R$ 2.275,08', () => {
    expect(DEDUCAO_POR_DEPENDENTE).toBe(2275.08);
  });
  it('teto educação = R$ 3.561,50', () => {
    expect(TETO_EDUCACAO_POR_PESSOA).toBe(3561.50);
  });
  it('teto PGBL = 12%', () => {
    expect(TETO_PGBL_PCT).toBe(0.12);
  });
});

// ── Simplificada ────────────────────────────────────────
describe('calcularSimplificada', () => {
  it('rendimento zero → resultado zero', () => {
    const r = calcularSimplificada(dados({}));
    expect(r.impostoDevido).toBe(0);
    expect(r.resultado).toBe(0);
    expect(r.tipoResultado).toBe('nenhum');
  });

  it('rendimento isento (abaixo da 1ª faixa) → imposto zero', () => {
    // 28559.70 / 0.80 = 35699.625 → renda que após 20% desconto fica em 28559.70
    const r = calcularSimplificada(dados({ rendimentosTributaveis: 25000 }));
    // base = 25000 * 0.80 = 20000, isento
    expect(r.impostoDevido).toBe(0);
    expect(r.totalDeducoes).toBe(5000);
  });

  it('desconto limitado ao teto', () => {
    const renda = 200000;
    const r = calcularSimplificada(dados({ rendimentosTributaveis: renda }));
    expect(r.totalDeducoes).toBe(TETO_DESCONTO_SIMPLIFICADO);
    expect(r.baseCalculo).toBe(renda - TETO_DESCONTO_SIMPLIFICADO);
  });

  it('restituição quando retido > devido', () => {
    const r = calcularSimplificada(dados({
      rendimentosTributaveis: 60000,
      impostoRetido: 10000,
    }));
    expect(r.tipoResultado).toBe('restituicao');
    expect(r.resultado).toBeGreaterThan(0);
  });

  it('pagamento quando retido < devido', () => {
    const r = calcularSimplificada(dados({
      rendimentosTributaveis: 120000,
      impostoRetido: 500,
    }));
    expect(r.tipoResultado).toBe('pagamento');
    expect(r.resultado).toBeLessThan(0);
  });
});

// ── Completa ────────────────────────────────────────────
describe('calcularCompleta', () => {
  it('rendimento zero → resultado zero', () => {
    const r = calcularCompleta(dados({}));
    expect(r.impostoDevido).toBe(0);
    expect(r.totalDeducoes).toBe(0);
  });

  it('deduz INSS corretamente', () => {
    const renda = 60000;
    const inss = 6588;
    const r = calcularCompleta(dados({ rendimentosTributaveis: renda, inss }));
    expect(r.baseCalculo).toBe(renda - inss);
  });

  it('deduz dependentes corretamente', () => {
    const renda = 80000;
    const r = calcularCompleta(dados({ rendimentosTributaveis: renda, dependentes: 2 }));
    expect(r.totalDeducoes).toBe(DEDUCAO_POR_DEPENDENTE * 2);
    expect(r.baseCalculo).toBe(renda - DEDUCAO_POR_DEPENDENTE * 2);
  });

  it('limita educação ao teto por pessoa', () => {
    const r = calcularCompleta(dados({
      rendimentosTributaveis: 100000,
      despesasEducacao: 20000,
      educacaoPessoas: 2,
    }));
    // 2 pessoas * R$ 3.561,50 = R$ 7.123,00 (< 20.000)
    expect(r.totalDeducoes).toBe(TETO_EDUCACAO_POR_PESSOA * 2);
  });

  it('educação não limita se abaixo do teto', () => {
    const r = calcularCompleta(dados({
      rendimentosTributaveis: 100000,
      despesasEducacao: 3000,
      educacaoPessoas: 1,
    }));
    expect(r.totalDeducoes).toBe(3000);
  });

  it('limita PGBL a 12% da renda bruta', () => {
    const renda = 100000;
    const pgbl = 20000; // > 12% de 100k = 12k
    const r = calcularCompleta(dados({
      rendimentosTributaveis: renda,
      previdenciaPrivadaPGBL: pgbl,
    }));
    expect(r.totalDeducoes).toBe(renda * TETO_PGBL_PCT);
  });

  it('despesas médicas sem limite', () => {
    const renda = 100000;
    const medicas = 50000;
    const r = calcularCompleta(dados({
      rendimentosTributaveis: renda,
      despesasMedicas: medicas,
    }));
    expect(r.totalDeducoes).toBe(medicas);
  });

  it('soma todas as deduções', () => {
    const r = calcularCompleta(dados({
      rendimentosTributaveis: 200000,
      inss: 8000,
      dependentes: 1,
      despesasMedicas: 5000,
      despesasEducacao: 3000,
      educacaoPessoas: 1,
      previdenciaPrivadaPGBL: 10000,
      pensaoAlimenticia: 2000,
      livroCaixa: 1000,
      outrasDeducoes: 500,
    }));
    const expected = 8000 + DEDUCAO_POR_DEPENDENTE + 5000 + 3000 + 10000 + 2000 + 1000 + 500;
    expect(r.totalDeducoes).toBeCloseTo(expected, 2);
  });

  it('base de cálculo nunca fica negativa', () => {
    const r = calcularCompleta(dados({
      rendimentosTributaveis: 10000,
      inss: 5000,
      despesasMedicas: 20000,
    }));
    expect(r.baseCalculo).toBe(0);
    expect(r.impostoDevido).toBe(0);
  });
});

// ── Comparativo ─────────────────────────────────────────
describe('calcularComparativo', () => {
  it('retorna ambas as opções', () => {
    const c = calcularComparativo(dados({ rendimentosTributaveis: 80000 }));
    expect(c.simplificada).toBeDefined();
    expect(c.completa).toBeDefined();
    expect(['simplificada', 'completa']).toContain(c.melhorOpcao);
    expect(c.economia).toBeGreaterThanOrEqual(0);
  });

  it('sem deduções → simplificada é melhor', () => {
    const c = calcularComparativo(dados({ rendimentosTributaveis: 80000 }));
    // Sem deduções, simplificada dá 20% de desconto, completa dá 0
    expect(c.melhorOpcao).toBe('simplificada');
  });

  it('muitas deduções → completa é melhor', () => {
    const c = calcularComparativo(dados({
      rendimentosTributaveis: 200000,
      inss: 8000,
      dependentes: 3,
      despesasMedicas: 30000,
      despesasEducacao: 10000,
      educacaoPessoas: 3,
      previdenciaPrivadaPGBL: 24000,
      pensaoAlimenticia: 5000,
    }));
    expect(c.melhorOpcao).toBe('completa');
  });

  it('economia = diferença absoluta entre resultados', () => {
    const c = calcularComparativo(dados({
      rendimentosTributaveis: 100000,
      impostoRetido: 5000,
    }));
    expect(c.economia).toBeCloseTo(
      Math.abs(c.completa.resultado - c.simplificada.resultado),
      2
    );
  });
});

// ── Tabela Progressiva ──────────────────────────────────
describe('Tabela progressiva', () => {
  it('faixa 1 - isento', () => {
    const r = calcularCompleta(dados({ rendimentosTributaveis: 20000 }));
    expect(r.impostoDevido).toBe(0);
  });

  it('alíquota efetiva cresce com a renda', () => {
    const r1 = calcularCompleta(dados({ rendimentosTributaveis: 40000 }));
    const r2 = calcularCompleta(dados({ rendimentosTributaveis: 100000 }));
    const r3 = calcularCompleta(dados({ rendimentosTributaveis: 200000 }));

    const eff1 = r1.impostoDevido / 40000;
    const eff2 = r2.impostoDevido / 100000;
    const eff3 = r3.impostoDevido / 200000;

    expect(eff2).toBeGreaterThan(eff1);
    expect(eff3).toBeGreaterThan(eff2);
  });
});

// ── Caso real: assalariado ──────────────────────────────
describe('Caso real: assalariado R$ 5k/mês', () => {
  const caso = dados({
    rendimentosTributaveis: 60000,
    inss: 6588,
    dependentes: 1,
    despesasMedicas: 2000,
    despesasEducacao: 3000,
    educacaoPessoas: 1,
    impostoRetido: 4500,
  });

  it('comparativo deve ter melhor opção definida', () => {
    const c = calcularComparativo(caso);
    expect(c.melhorOpcao).toBeDefined();
    expect(c.economia).toBeGreaterThanOrEqual(0);
  });

  it('completa deve ter deduções maiores que simplificada para este caso', () => {
    const c = calcularComparativo(caso);
    const deducoesCompleta = caso.inss + DEDUCAO_POR_DEPENDENTE + 2000 + 3000;
    expect(c.completa.totalDeducoes).toBeCloseTo(deducoesCompleta, 2);
  });
});
