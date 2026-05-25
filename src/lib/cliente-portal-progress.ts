// Helper to compute filling percentage of the client cadastral form.
// Usado no card "Informações Cadastrais" do portal do cliente.

interface FormularioLike {
  estado_civil?: string | null;
  data_nascimento?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  ocupacao_principal?: string | null;
  chave_pix_cliente?: string | null;
  informacoes_adicionais?: string | null;
  status_preenchimento?: string | null;
  rendimentos_emprego?: unknown;
  rendimentos_autonomo?: unknown;
  rendimentos_aluguel?: unknown;
  outros_rendimentos?: unknown;
  bens_direitos?: unknown;
  dividas_onus?: unknown;
  despesas_medicas?: unknown;
  despesas_educacao?: unknown;
  previdencia_privada?: unknown;
  dependentes?: unknown;
  alimentandos?: unknown;
}

const nonEmpty = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
const hasItems = (v: unknown) => Array.isArray(v) && v.length > 0;
const hasObjData = (v: unknown) =>
  !!v && typeof v === 'object' && !Array.isArray(v) && Object.values(v as Record<string, unknown>).some(
    (x) => (typeof x === 'string' ? x.trim().length > 0 : x !== null && x !== undefined && x !== 0)
  );

export function calcularProgressoFormulario(formulario: FormularioLike | null | undefined): number {
  if (!formulario) return 0;
  if (formulario.status_preenchimento === 'concluido') return 100;

  let score = 0;

  // 10 — estado civil + nascimento
  if (nonEmpty(formulario.estado_civil) && nonEmpty(formulario.data_nascimento)) score += 10;

  // 15 — endereço
  const enderecoFields = [
    formulario.cep, formulario.logradouro, formulario.numero,
    formulario.bairro, formulario.cidade, formulario.uf,
  ];
  if (enderecoFields.every(nonEmpty)) score += 15;

  // 5 — ocupação
  if (nonEmpty(formulario.ocupacao_principal)) score += 5;

  // 25 — rendimentos
  if (
    hasItems(formulario.rendimentos_emprego) ||
    hasItems(formulario.rendimentos_aluguel) ||
    hasObjData(formulario.rendimentos_autonomo) ||
    hasObjData(formulario.outros_rendimentos)
  ) score += 25;

  // 10 — bens
  if (hasItems(formulario.bens_direitos)) score += 10;

  // 5 — dívidas (opcional, conta se houver)
  if (hasItems(formulario.dividas_onus)) score += 5;

  // 15 — deduções
  if (
    hasItems(formulario.despesas_medicas) ||
    hasItems(formulario.despesas_educacao) ||
    hasObjData(formulario.previdencia_privada)
  ) score += 15;

  // 5 — dependentes/alimentandos
  if (hasItems(formulario.dependentes) || hasItems(formulario.alimentandos)) score += 5;

  // 10 — info adicional / pix
  if (nonEmpty(formulario.informacoes_adicionais) || nonEmpty(formulario.chave_pix_cliente)) score += 10;

  return Math.min(score, 99); // só 100 quando status_preenchimento = 'concluido'
}
