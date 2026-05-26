Plano para corrigir o borrão visual no Kanban em `/dashboard`:

1. Ajustar o card arrastável para não mover o card original
- Hoje o `useDraggable` aplica `transform` no próprio card da coluna e também renderiza uma cópia no `DragOverlay`.
- Isso pode causar o rastro/borrão vertical na coluna, porque o browser fica repintando texto, sombra e tooltip no card original.
- Vou deixar o card original estático durante o drag e usar apenas o `DragOverlay` como elemento visual que se move.

2. Remover efeitos visuais problemáticos durante o drag
- Desativar `transition`, `shadow`, `hover`, `rotate`, `scale`, `animate-pulse` e tooltip enquanto qualquer card estiver sendo arrastado.
- Manter uma aparência simples e estável no overlay, sem transformação extra que force repintura desnecessária.

3. Isolar o estado visual do Kanban durante o arraste
- Adicionar uma classe/estado no container do board durante o drag para congelar animações/transições internas.
- Nas colunas, trocar realces animados por estados imediatos enquanto estiver arrastando, evitando repaint da coluna inteira.

4. Validar o resultado
- Conferir que o card ainda abre ao clicar.
- Conferir que arrastar entre colunas continua atualizando o status.
- Conferir que o borrão/rastro não aparece mais durante o movimento.