## Escopo (somente portal do cliente — UI)

Três ajustes pequenos, sem tocar schema, RLS, edge functions ou área do contador.

---

### 1. Deleção de documentos em `/cliente/documentos`

**Causa raiz:** o botão da lixeira só aparece quando `!docsEnviadosAoContador`. Como o `handleFiles` (linha ~239) já marca `status_documentos: 'enviado'` automaticamente a cada upload bem-sucedido, logo após o primeiro arquivo o trash some — por isso o cliente "não consegue deletar".

RLS está OK (verifiquei `checklist_documentos` e `storage.objects` para `documentos-clientes` — políticas de DELETE para o cliente existem e cobrem o path `{escritorio_id}/{cliente_id}/...`).

**Correção (somente UI, mínima):**
- Em `src/pages/cliente/ClienteDocumentos.tsx`, remover o gate `{!docsEnviadosAoContador && (...)}` do botão de exclusão (linha ~561). Trash fica sempre visível enquanto a declaração não está `transmitida`.
- Manter o `AlertDialog` de confirmação e a notificação ao contador exatamente como estão.
- **Não** mexer no auto-set de `status_documentos='enviado'` no upload (mudança de regra de negócio, fora de escopo).

### 2. Botões laranja nos cards de alerta

Hoje os botões dos cards "Procuração Eletrônica e-CAC" (`ClienteDashboard.tsx` ~346) e "Não sabe quais documentos enviar?" (`ClienteDocumentos.tsx` ~457) usam `bg-primary` (verde), competindo com o tom warning do card.

**Correção:** trocar para o token semântico `warning`:
```
className="gap-2 bg-warning text-warning-foreground hover:bg-warning/90 ..."
```
Mantém o resto (ícone, tamanho, largura responsiva). Sem hardcode de cor.

### 3. Stepper: "onda" pulsante em vez de `animate-pulse`

Em `src/components/cliente-portal/StatusStepper.tsx`, trocar a bolinha atual de `animate-pulse` (fade do círculo inteiro) por um efeito de **ripple/onda** em volta — usando o `animate-ping` do Tailwind num ring absoluto, mantendo o ícone estático e legível.

Estrutura para a bolinha atual (mobile e desktop):
```tsx
<div className="relative">
  <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping" />
  <div className="relative w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center">
    <Icon className="h-5 w-5" />
  </div>
</div>
```
- `animate-ping` já vem no Tailwind (scale + fade infinito) → cria a onda visualmente.
- O `bg-accent/40` dá a cor da onda; o círculo principal permanece sólido.
- Aplicar tanto no bloco mobile (linhas ~41-44) quanto no desktop (linhas ~83-89).

### Arquivos tocados
- `src/pages/cliente/ClienteDocumentos.tsx` — remover gate do trash; botão "Ver lista de documentos" em warning.
- `src/pages/cliente/ClienteDashboard.tsx` — botão "Ver Passo a Passo" em warning.
- `src/components/cliente-portal/StatusStepper.tsx` — trocar `animate-pulse` por ring `animate-ping`.

### Fora de escopo
- Schema/RLS/triggers.
- Lógica de `status_documentos` no upload.
- Rotas/UI do contador.
