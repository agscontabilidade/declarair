Pelo diagnóstico, não parece ser cookies. O erro da imagem bate com falha real no backend: nos logs recentes, a função `register-from-invite` retornou 400 porque o CPF já estava cadastrado no escritório. A tela antiga mostra isso como mensagem genérica “Edge Function returned a non-2xx status code”, por isso parece erro técnico.

Plano para corrigir:

1. Melhorar a mensagem exibida no cadastro antigo
- Ajustar `src/pages/cliente/CadastroCliente.tsx` para extrair corretamente o corpo do erro quando a função retorna não-2xx.
- Em vez de mostrar “Edge Function returned a non-2xx status code”, mostrar a mensagem real: CPF já cadastrado, email já usado, link inválido, senha fraca etc.

2. Tratar CPF já existente de forma útil
- Ajustar `supabase/functions/register-from-invite/index.ts` para, quando o CPF já existir no mesmo escritório:
  - se o cliente já tiver acesso, retornar orientação clara para fazer login ou recuperar senha;
  - se o cliente existir mas ainda não tiver acesso, retornar orientação clara para pedir ao contador o “convite de acesso” pelo cadastro do cliente, evitando o autocadastro duplicado.

3. Reduzir confusão entre dois tipos de convite
- O botão “Gerar Link de Convite” hoje cria link de autocadastro em `/cadastro-cliente/:token`, que falha quando o CPF já existe.
- Manter esse fluxo para novo contribuinte, mas melhorar o texto do modal para deixar claro que ele é para contribuinte ainda não cadastrado.
- O convite de acesso para cliente já cadastrado continua sendo o link `/cliente/convite/:token` gerado na linha do cliente/tabela.

4. Validar o resultado
- Consultar logs da função após a alteração e garantir que os erros continuem controlados, mas com mensagem amigável no frontend.
- Não alterar schema, RLS ou regras de multi-tenancy.