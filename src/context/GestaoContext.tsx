import React, { createContext, useContext, ReactNode } from 'react';
import { useGestao } from '../hooks/useGestao';

type GestaoContextType = ReturnType<typeof useGestao>;

const GestaoContext = createContext<GestaoContextType | undefined>(undefined);

export const GestaoProvider = ({ children }: { children: ReactNode }) => {
  const gestao = useGestao();
  
  return (
    <GestaoContext.Provider value={gestao}>
      {children}
    </GestaoContext.Provider>
  );
};

export const useGestaoContext = () => {
  const context = useContext(GestaoContext);
  if (context === undefined) {
    throw new Error('useGestaoContext deve ser usado dentro de um GestaoProvider');
  }
  return context;
};
