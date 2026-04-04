import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSGLM } from '../context/SGLMContext';

interface PermissaoGuardProps {
  children: React.ReactNode;
  codigo: string;
}

/**
 * Guard para rotas que exigem uma permissão específica.
 */
export const PermissaoGuard: React.FC<PermissaoGuardProps> = ({ children, codigo }) => {
  const { usuarioAtual } = useSGLM();

  if (!usuarioAtual?.temPermissao(codigo)) {
    // Se não tem permissão, volta para a home do sistema
    return <Navigate to="/sistema" replace />;
  }

  return <>{children}</>;
};
