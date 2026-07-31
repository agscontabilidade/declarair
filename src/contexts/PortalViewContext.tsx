/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type PortalView = 'dashboard' | 'formulario' | 'documentos';

interface PortalViewContextType {
  clienteId: string;
  clienteNome: string;
  view: PortalView;
  setView: (v: PortalView) => void;
}

const PortalViewContext = createContext<PortalViewContextType | null>(null);

interface ProviderProps {
  clienteId: string;
  clienteNome: string;
  initialView?: PortalView;
  children: ReactNode;
}

export function PortalViewProvider({ clienteId, clienteNome, initialView = 'dashboard', children }: ProviderProps) {
  const [view, setView] = useState<PortalView>(initialView);
  const value = useMemo(
    () => ({ clienteId, clienteNome, view, setView }),
    [clienteId, clienteNome, view],
  );
  return <PortalViewContext.Provider value={value}>{children}</PortalViewContext.Provider>;
}

export function usePortalView() {
  return useContext(PortalViewContext);
}

/**
 * Retorna o cliente "ativo" do portal:
 * - no portal real, é o cliente logado (profile.clienteId)
 * - quando o contador visualiza o portal de um cliente, é o cliente visualizado
 */
export function useClienteAtivo() {
  const { profile } = useAuth();
  const portalView = usePortalView();

  return {
    clienteId: portalView?.clienteId ?? profile.clienteId,
    clienteNome: portalView?.clienteNome ?? profile.nome,
    isImpersonating: !!portalView,
    view: portalView?.view ?? null,
    setView: portalView?.setView ?? null,
  };
}
