import React, { createContext, useContext, ReactNode } from 'react';
import { useSessaoAtiva } from '../hooks/useSessaoAtiva';

type SessaoAtivaContextType = ReturnType<typeof useSessaoAtiva>;

const SessaoAtivaContext = createContext<SessaoAtivaContextType | undefined>(undefined);

export const SessaoAtivaProvider = ({ children }: { children: ReactNode }) => {
  const sessaoAtiva = useSessaoAtiva();
  
  return (
    <SessaoAtivaContext.Provider value={sessaoAtiva}>
      {children}
    </SessaoAtivaContext.Provider>
  );
};

export const useSessaoAtivaContext = () => {
  const context = useContext(SessaoAtivaContext);
  if (context === undefined) {
    throw new Error('useSessaoAtivaContext deve ser usado dentro de um SessaoAtivaProvider');
  }
  return context;
};
