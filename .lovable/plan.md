

# Plano: Auto-preenchimento de CNPJ e CEP

## APIs Gratuitas

1. **CEP** — `https://viacep.com.br/ws/{cep}/json/` (ja usada no Onboarding)
2. **CNPJ** — `https://brasilapi.com.br/api/cnpj/v1/{cnpj}` (gratuita, sem chave, retorna razao_social, nome_fantasia, logradouro, municipio, uf, cep, telefone, email)

## Onde Aplicar

| Local | Campo | API |
|-------|-------|-----|
| `src/pages/Onboarding.tsx` | CNPJ do escritorio | BrasilAPI CNPJ → preenche razao_social, nome_fantasia, email, telefone, cep, logradouro, bairro, cidade, uf |
| `src/pages/Onboarding.tsx` | CEP | ViaCEP (ja existe, manter) |
| `src/pages/Configuracoes.tsx` | CNPJ do escritorio | BrasilAPI CNPJ → preenche nome, email |

## Implementacao

### 1. Criar `src/lib/apiBrasil.ts` — Utilitarios compartilhados

```typescript
// Busca CNPJ na BrasilAPI (gratis, sem chave)
export async function buscarCNPJ(cnpj: string) { ... }

// Busca CEP na ViaCEP (gratis, sem chave)  
export async function buscarCEP(cep: string) { ... }
```

Ambas funcoes retornam dados tipados ou `null` em caso de erro. Tratamento de loading e toast ficam no componente.

### 2. `src/pages/Onboarding.tsx`

- Adicionar funcao `buscarCnpj()` chamada no `onBlur` do campo CNPJ
- Quando CNPJ tem 14 digitos, chama BrasilAPI e preenche automaticamente: razaoSocial, nomeFantasia, emailEmpresa, telefoneEmpresa, cep, logradouro, bairro, cidade, uf
- Apos preencher CEP vindo do CNPJ, nao precisa chamar ViaCEP novamente (ja vem do CNPJ)
- Manter `buscarCep()` existente para edicao manual do CEP
- Adicionar mascara CNPJ no onChange (ja existe `formatCnpj`)
- Toast de feedback: "Dados do CNPJ preenchidos automaticamente"

### 3. `src/pages/Configuracoes.tsx`

- Adicionar `onBlur` no campo CNPJ para buscar dados via BrasilAPI
- Preencher nome e email do escritorio se estiverem vazios
- Toast de feedback

### 4. Arquivos

| Arquivo | Acao |
|---------|------|
| `src/lib/apiBrasil.ts` | Novo — funcoes `buscarCNPJ` e `buscarCEP` |
| `src/pages/Onboarding.tsx` | Adicionar auto-fill CNPJ no onBlur, usar `buscarCNPJ` |
| `src/pages/Configuracoes.tsx` | Adicionar auto-fill CNPJ no onBlur |

Nenhuma chave de API necessaria. Ambas APIs sao 100% gratuitas e publicas.

