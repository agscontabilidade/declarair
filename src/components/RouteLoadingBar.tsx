/**
 * Barra de progresso fina fixa no topo, usada como fallback do <Suspense>
 * nas trocas de rota. Evita o "flash" branco do FullscreenSpinner.
 */
export function RouteLoadingBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 overflow-hidden bg-transparent pointer-events-none">
      <div className="h-full w-1/3 bg-primary animate-route-progress" />
    </div>
  );
}
