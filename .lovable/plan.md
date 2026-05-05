Vou corrigir a seção de Análise de Caixa em `/declaracoes/:id` para que a lista e a expansão usem a análise correta e exibam os dados completos.

Plano de implementação:

1. Corrigir a origem dos dados da lista
- A tabela do Histórico de Análises passará a ler os KPIs primeiro do JSON estruturado salvo da análise (`resultado_json`).
- Se `resultado_json` estiver vazio, o componente tentará extrair o JSON de `resultado_texto`.
- Se o JSON estiver quebrado, ainda assim tentará recuperar os campos principais de forma tolerante para preencher pelo menos saldo, riscos e veredito.
- Só usará `resumo_visual` como fallback, porque hoje ele está vindo nulo nessa análise e por isso aparecem `---` e `Processando...`.

2. Normalizar os campos da análise
- Criar uma função utilitária no componente para transformar cada análise em um objeto visual único com:
  - veredito normalizado: `transmitir`, `ajustar` ou `nao_transmitir`
  - saldo de caixa
  - total de origens
  - total de aplicações
  - estouro de caixa
  - riscos alto/médio/baixo
  - mensagem curta do veredito
- Mapear `nao_transmitir` para o badge “Bloqueado”, e `ajustar` para “Ajustar”.

3. Corrigir a expansão da análise completa
- Ao clicar em uma linha do histórico, o card detalhado será aberto automaticamente com a análise selecionada.
- O conteúdo expandido será montado a partir da análise selecionada, não de um estado textual antigo.
- Os cards visuais, gráficos, recomendações, veredito final e texto técnico aparecerão juntos na expansão.
- Se o usuário clicar na mesma análise aberta, ela recolhe; se clicar novamente, reabre corretamente.

4. Melhorar a renderização quando o JSON da IA vier imperfeito
- Ajustar `VisualIAFiscal` para aceitar também `dadosEstruturados` já parseados pelo componente pai.
- Assim, mesmo quando o bloco JSON em markdown estiver parcialmente quebrado, os cards e gráficos poderão abrir com os dados estruturados salvos ou recuperados.
- Remover o risco de o JSON aparecer cru para o contador.

5. Melhorar a legibilidade do texto técnico
- Exibir o texto em um card mais limpo, com espaçamento maior, títulos destacados, listas mais legíveis e linguagem visual separando:
  - resumo executivo
  - pontos de atenção
  - recomendações
  - detalhamento técnico
- Manter o texto completo, mas menos “parede de texto”.

6. Melhorar tooltips e colunas
- Expandir tooltips das colunas para explicar objetivamente:
  - Data e hora: quando a IA processou a análise.
  - Veredito: quando é transmitir, ajustar ou bloquear.
  - Saldo de caixa: exemplo positivo e negativo.
  - Riscos: diferença entre alto, médio e baixo, com exemplos de discrepâncias.
- Incluir informações úteis na lista, como totais de origem/aplicação ou mensagem curta quando houver espaço.

7. Atualização/recarregamento consistente
- O botão de atualizar lista invalidará a busca do histórico e manterá a análise mais recente/selecionada sincronizada.
- O botão de recarregar no detalhe buscará novamente os dados e reabrirá o card com a análise correta.

Detalhe técnico importante:
- Encontrei no banco a análise atual desta declaração com `resultado_json` e `resumo_visual` nulos. O JSON ficou inválido no texto gerado pela IA, por isso a tela não consegue preencher as colunas nem montar os cards/gráficos. A correção será feita no front-end com parser tolerante e, na função de IA, vou endurecer o salvamento para extrair/salvar os KPIs sempre que possível nas próximas análises.