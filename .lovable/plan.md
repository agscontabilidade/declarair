Vou corrigir a validação para cumprir o objetivo principal: **validar documentos por algoritmo sempre que possível e nunca bloquear o sistema por falta de créditos de IA**.

Plano:

1. **Fortalecer a extração nativa sem IA**
   - Manter `unpdf`, mas melhorar os critérios de qualidade do texto extraído.
   - Ajustar regex/heurísticas para reconhecer melhor DIRPF, Saída Definitiva, Comunicação de Saída, Recibo, DASN-SIMEI e DARF.
   - Não exigir IA quando o documento textual tiver marcadores confiáveis, CPF válido e ano compatível.
   - Para valores financeiros, manter regra conservadora: só preencher automaticamente quando o valor for encontrado com alta confiança; caso contrário, não inventar valor.

2. **Parar de transformar PDF escaneado em erro de créditos**
   - Quando o PDF for imagem/scan sem texto extraível, o backend **não deve chamar IA obrigatoriamente**.
   - Em vez disso, retornar um status controlado, por exemplo `requires_manual_review`, com mensagem clara: “PDF escaneado ou sem texto pesquisável; valide manualmente ou envie um PDF gerado pelo programa da Receita”.
   - Isso elimina o erro “Créditos de IA esgotados” para o usuário final.

3. **Usar IA só como fallback opcional e seguro**
   - Se a extração nativa falhar por ambiguidade, a IA poderá ser tentada apenas quando fizer sentido.
   - Se a IA retornar 402/429 ou qualquer falha, o sistema cai para revisão manual, sem mostrar erro de crédito e sem apagar o fluxo do usuário.

4. **Adicionar revisão manual no upload**
   - No componente de anexar PDFs, quando o backend retornar `requires_manual_review`, manter o arquivo enviado e abrir/indicar uma confirmação manual para o contador.
   - A confirmação manual deve exigir pelo menos: tipo do documento, CPF/cliente já conhecido, ano e campos críticos conforme o tipo.
   - Isso garante funcionamento mesmo para scans, sem depender de IA.

5. **Preservar lógica existente**
   - Não alterar schema salvo se for indispensável.
   - Manter atualizações atuais de status: declaração pronta, transmitida ao validar recibo, anexos MEI/DARF e checklist.
   - Manter isolamento por `escritorio_id` e validações de CPF/ano.

Resultado esperado:
- PDFs textuais da Receita validam rápido e sem IA.
- PDFs escaneados deixam de consumir IA automaticamente.
- Falta de créditos de IA não quebra o upload.
- Dados financeiros continuam conservadores: só entram automaticamente quando há leitura confiável; caso contrário, passam por revisão manual.