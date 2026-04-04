import React, { createContext, useContext, ReactNode } from 'react';
import { useSGLMRealtime } from '../hooks/useSGLMRealtime';

// Definimos o tipo do contexto baseado no retorno do nosso hook principal
type SGLMContextType = ReturnType<typeof useSGLMRealtime>;

const SGLMContext = createContext<SGLMContextType | undefined>(undefined);

/**
 * Provedor Global do SGLM.
 * Garante que o estado de tempo real e autenticação seja único em todo o app.
 */
export const SGLMProvider = ({ children }: { children: ReactNode }) => {
  const state = useSGLMRealtime();
  
  return (
    <SGLMContext.Provider value={state}>
      {children}
    </SGLMContext.Provider>
  );
};

/**
 * Hook para consumir os dados do SGLM de qualquer lugar sem criar novas conexões.
 */
export const useSGLM = () => {
  const context = useContext(SGLMContext);
  if (context === undefined) {
    throw new Error('useSGLM deve ser usado dentro de um SGLMProvider');
  }
  return context;
};
