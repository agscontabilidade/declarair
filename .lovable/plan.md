Plano para resolver definitivamente os erros do GitHub Actions sem quebrar o sistema:

1. Corrigir o workflow do GitHub Actions
- Alterar o CI para usar uma versão fixa do Bun, evitando que `bun-version: latest` quebre de forma imprevisível em runs futuros.
- Atualizar `actions/checkout` para uma versão compatível com Node 24, eliminando o aviso de depreciação de Node 20 que aparece nas evidências.
- Adicionar checagem de build no CI para capturar erros reais antes dos testes E2E.

2. Estabilizar os testes E2E que rodam no GitHub
- Ajustar seletores frágeis que provavelmente falham depois das últimas mudanças de rotas/UI, especialmente o link de recuperação de senha que hoje espera `/recuperar-senha`, mas a tela usa `/recuperar-senha?origem=contador`.
- Remover/ajustar rota protegida obsoleta nos testes (`/mensagens` agora redireciona para `/configuracoes?tab=mensagens`, não é mais uma rota protegida direta).
- Manter os testes focados em rotas públicas/protegidas essenciais para reduzir falsos negativos no CI.

3. Garantir variáveis públicas no ambiente do GitHub
- Configurar o workflow para fornecer `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PROJECT_ID` durante build/testes no GitHub.
- Usar apenas chaves publicáveis/anon no workflow; nada de service role ou segredo privado.

4. Verificar localmente os sinais relevantes
- Rodar testes unitários e E2E via comandos de teste permitidos para confirmar a correção antes de concluir.
- Se aparecer erro específico adicional, corrigir somente o ponto necessário.

5. Segurança
- Não vou alterar banco, RLS, autenticação, migrations ou funções backend nesta correção do GitHub.
- O objetivo aqui é fechar o problema recorrente do CI com estabilidade; a varredura de segurança pode ser rodada depois como etapa separada, sem misturar com correção de pipeline.