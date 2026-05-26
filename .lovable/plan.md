## Alterar zoom padrão do visualizador de PDF

**Arquivo:** `src/components/drive/viewers/PdfViewer.tsx` (linha 25)

**Mudança:**
```diff
- const [scale, setScale] = useState<number>(1.2);
+ const [scale, setScale] = useState<number>(1.8);
```

**Efeito:**
- Todo PDF aberto no visualizador começa em 180% (em vez de 120%).
- Botão "Redefinir zoom" também passa a voltar para 180%, se estiver atrelado ao mesmo valor inicial (verificar `handleResetZoom` na mesma checagem).
- Controles `+` / `−` e limites (0.5 a 3) permanecem inalterados.

**Fora de escopo:** nenhuma outra alteração de UI, cache, prefetch ou lógica.