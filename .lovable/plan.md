## Diagnóstico

Os logs mostram que o OCR está sendo chamado, mas o OCR.space retorna erro:

```text
The maximum page limit of 3 was reached and only pages upto the limit were parsed successfully
```

Como a função trata esse retorno como falha total, ela não guarda nenhum texto OCR. Em seguida, a IA também não roda porque depende de texto extraído com segurança. Resultado: os dados não são atualizados.

## Plano de ajuste

1. **Ajustar a chamada do OCR.space para declaração**
   - Enviar parâmetros explícitos para processar apenas as primeiras páginas úteis do PDF, evitando o erro de limite de páginas.
   - Para declaração IRPF, priorizar as páginas finais/iniciais necessárias para identificar CPF, ano e bloco `RESUMO`, sem tentar OCR do PDF inteiro quando isso estoura limite.

2. **Aceitar OCR parcial quando houver texto útil**
   - Hoje, se `IsErroredOnProcessing` vem true, o código descarta tudo.
   - Vou alterar para aproveitar `ParsedResults[].ParsedText` quando existir texto suficiente, mesmo que o OCR.space informe aviso/limite de páginas.
   - Só falhar se não houver texto realmente aproveitável.

3. **Permitir IA como 2ª opção quando OCR retornar texto parcial**
   - Fluxo para `tipo=declaracao` ficará:

```text
OCR.space -> regex sobre OCR -> IA sobre texto OCR parcial -> revisão manual
```

   - A IA continuará sem ler o PDF diretamente, para evitar novo `WORKER_RESOURCE_LIMIT`.
   - A IA só receberá texto que já veio do OCR, mantendo baixo consumo e sem processamento pesado.

4. **Evitar o parser nativo como fallback para declaração escaneada**
   - Se o PDF for detectado como scan/imagem, não insistir no parser nativo depois do OCR, pois ele não consegue extrair texto real e só aumenta risco de CPU.
   - Para `recibo`, `mei` e `darf`, manter o fluxo atual para não mexer no que não foi pedido.

5. **Melhorar logs de validação**
   - Registrar quando o OCR foi parcial mas aproveitado.
   - Registrar quando a IA foi acionada com texto OCR.
   - Registrar claramente o motivo de cair em revisão manual.

6. **Deploy da função**
   - Depois dos ajustes, redeploy apenas da função `processar-pdf-declaracao`.
   - Sem alterações em banco, RLS, UI ou schema.