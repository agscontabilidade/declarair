## Mudanças em `src/components/declaracoes/AnexarDeclaracaoButton.tsx`

1. **Header do dropdown** (linha ~226-228): trocar "Validação automática por IA" por **"Validação inteligente"**. Manter o ícone `Sparkles` em verde.

2. **Botões "Anexar" / "Substituir"** de cada seção (linha ~252-265): aplicar cor suave em vez do `variant="outline"` neutro. Usar tom emerald discreto, compatível com o design system (primário Emerald #10B981):
   - Classe: `border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800`
   - Mantém ícones `Upload` / `Loader2` e o tamanho `h-7 text-xs`.
   - Botão "Baixar" (`Download`) permanece `variant="ghost"` (sem alteração) para não competir visualmente.

3. Nenhuma alteração no botão trigger principal, na lógica de upload, na edge function ou em qualquer outro arquivo.

## Resultado
Dropdown mais leve e amigável: header com nomenclatura neutra ("Validação inteligente") e botões de anexar em verde suave, alinhados à marca.