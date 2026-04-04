import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSGLM } from '../context/SGLMContext';

/**
 * Guard que permite acesso apenas para Administradores Globais do SGLM.
 * Útil para rotas de configuração de sistema e gestão de múltiplas câmaras.
 */
export const AdminGlobalGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuarioAtual } = useSGLM();

  if (!usuarioAtual?.eAdminGlobal()) {
    // Se não for admin global, redireciona para o painel principal do sistema
    return <Navigate to="/sistema" replace />;
  }

  return <>{children}</>;
};
