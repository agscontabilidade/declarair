## Problema identificado

Na aba **Configurações → Marca & Whitelabel** existe um bug que faz parecer que as configurações "não persistem" ao salvar:

O hook `usePersistedForm` (usado em `WhitelabelTab`) grava em `localStorage` a CADA mudança do form, inclusive no primeiro render com os valores **default** (`#1E3A5F`, `#F8FAFC`, etc.). Quando o `useQuery` finalmente retorna os dados reais do escritório, o `useEffect` verifica `localStorage` — encontra os defaults já gravados — e **não reseeda** com os valores do banco. Resultado: o usuário vê os defaults mesmo tendo salvo cores/textos diferentes, dando a impressão de que nada foi persistido.

Os dados **são** salvos corretamente no banco (`escritorios.cor_primaria`, `cor_fundo_portal`, `nome_portal`, `texto_boas_vindas`, `whitelabel_ativo`, `logo_url`) — o problema é só na hidratação do formulário.

Além disso, hoje não existe forma de voltar ao padrão do sistema sem editar campo por campo.

## Mudanças propostas (apenas frontend, escopo restrito)

Arquivo único: `src/components/configuracoes/WhitelabelTab.tsx`

1. **Remover o `usePersistedForm`** desta aba e substituir por `useState` simples seedado a partir do `escritorio` retornado pelo `useQuery` (via `useEffect` que dispara quando `escritorio?.id` muda).
   - Mantém rascunho local enquanto edita, mas sempre reflete o banco após save/reload.
   - Limpa também a chave antiga `form_persistence_whitelabel_<escritorioId>` do localStorage uma vez na montagem (cleanup de dados velhos para usuários que já visitaram).

2. **Corrigir invalidação da query** após salvar/upload de logo: usar `queryKey: ['escritorio-brand', escritorioId]` (hoje está sem o id, funciona por prefixo mas é frágil).

3. **Adicionar botão "Restaurar padrão do sistema"** ao lado do botão "Salvar":
   - Abre `AlertDialog` de confirmação ("Isto vai remover suas cores, nome do portal, texto de boas-vindas e desativar o whitelabel. O logo é mantido.").
   - Ao confirmar, faz `UPDATE escritorios SET cor_primaria=NULL, cor_fundo_portal=NULL, nome_portal=NULL, texto_boas_vindas=NULL, whitelabel_ativo=false WHERE id=escritorioId`.
   - Reseta o form local para os defaults visuais (`#1E3A5F`, `#F8FAFC`, textos vazios, switch off).
   - Invalida `['escritorio-brand', escritorioId]`.
   - Disponível apenas para `isDono`.

4. **Adicionar botão "Remover logo"** (somente quando existe `escritorio.logo_url`):
   - Confirmação simples.
   - `UPDATE escritorios SET logo_url=NULL WHERE id=escritorioId`.
   - Não tenta apagar o arquivo do storage (mantém compatibilidade, sem mexer em RLS/storage).
   - Apenas para `isDono`.

5. **Preview**: continua refletindo os valores atuais do form (já funciona).

## Fora do escopo (não vou mexer)

- Backend, RLS, schema, migrations.
- `usePersistedForm` em outros lugares do projeto.
- Como `ClienteLayout` e `CadastroCliente` consomem o branding (já leem corretamente do banco com fallback para defaults).
- Bucket `logos-escritorios` e qualquer policy de storage.
- Lógica de billing / addon de whitelabel.

## Risco

Muito baixo. Mudança isolada em um único componente de UI, mesma tabela e mesmos campos já gravados/lidos hoje, sem alteração de contratos. Não afeta clientes em produção que já têm branding salvo — pelo contrário, eles passarão a ver corretamente o que está salvo.
