export interface DadosCNPJ {
  razao_social: string;
  nome_fantasia: string | null;
  email: string | null;
  ddd_telefone_1: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
}

export interface DadosCEP {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function buscarCNPJ(cnpj: string): Promise<DadosCNPJ | null> {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return null;
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function buscarCEP(cep: string): Promise<DadosCEP | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}
