import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type PanelType = 'profile' | 'notifications' | null;

interface PanelContextType {
  activePanel: PanelType;
  togglePanel: (panel: PanelType) => void;
  closePanel: () => void;
}

const PanelContext = createContext<PanelContextType>({
  activePanel: null,
  togglePanel: () => {},
  closePanel: () => {},
});

export function PanelProvider({ children }: { children: ReactNode }) {
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  const togglePanel = useCallback((panel: PanelType) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }, []);

  const closePanel = useCallback(() => setActivePanel(null), []);

  return (
    <PanelContext.Provider value={{ activePanel, togglePanel, closePanel }}>
      {children}
    </PanelContext.Provider>
  );
}

export function usePanel() {
  return useContext(PanelContext);
}
