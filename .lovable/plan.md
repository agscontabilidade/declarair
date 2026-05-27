
## Problema

No template `envio-manual-declaracao` (email com anexos da declaração + recibo), os botões "Baixar X" usam apenas classes Tailwind (`className="block bg-emerald-600 ..."`). Em clientes de email mais restritivos (Outlook, iOS Mail, alguns mobile) parte do CSS gerado pelo `<Tailwind>` é descartada, o `display: block` se perde e o `<a>` herda o estilo "visited" — fica **roxo, sem fundo, e inline**, exatamente como na imagem do cliente.

O CC que abriu no Gmail web viu correto por sorte (Gmail processa o CSS gerado). Não é confiável.

## Correção

No arquivo `supabase/functions/_shared/transactional-email-templates/envio-manual-declaracao.tsx`, substituir o bloco de botões por **estilos inline explícitos** (a forma mais resiliente para email), mantendo o visual atual (verde emerald, mesma fonte/tamanho/cantos):

1. Trocar `<Button className="block bg-emerald-600 ...">` por `<Button style={{...}}>` com um objeto de estilo contendo:
   - `display: 'block'`
   - `width: '100%'`
   - `backgroundColor: '#059669'` (emerald-600 em hex — clients não interpretam classes)
   - `color: '#ffffff'`
   - `textDecoration: 'none'`
   - `fontWeight: 'bold'`
   - `fontSize: '13px'`
   - `padding: '10px 14px'`
   - `borderRadius: '6px'`
   - `textAlign: 'center' as const`
   - `boxSizing: 'border-box' as const`

2. Envolver cada botão em seu próprio `<Section style={{ marginBottom: '8px' }}>` para garantir empilhamento vertical em todos os clientes (sem depender de margin de Tailwind).

3. Manter o resto do template intacto — header, mensagem, layout, footer.

## Por que isso resolve

- `style` inline é o único caminho 100% confiável em email: Outlook, Gmail, Apple Mail, Yahoo, iOS Mail, Android Mail respeitam atributo `style` direto no elemento.
- Definir `color: #ffffff` inline **vence** a regra `:visited { color: purple }` do cliente, eliminando o bug roxo.
- `display: block` + `width: 100%` inline garante empilhamento (sem ficar lado a lado).
- Cor em hex (`#059669`) em vez de classe `bg-emerald-600` remove qualquer dependência de processamento Tailwind.

## Escopo

- **Apenas** o template `envio-manual-declaracao.tsx`.
- Nenhuma mudança em outros templates, edge functions, banco ou call-sites.
- Visual final idêntico ao que o CC já vê (verde empilhado), garantido em todos os clientes.

## Deploy

Após editar, redeploy de `send-transactional-email` (que importa o registry).

## Validação

- Reenviar o email para um endereço de teste e verificar nos clientes mais comuns (Gmail, Outlook web, iOS Mail) que os dois botões aparecem verdes, empilhados e com texto branco.
