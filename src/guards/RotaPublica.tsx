import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

/**
 * Guard para rotas que só devem ser acessadas por usuários NÃO autenticados.
 * Exemplo: Login, Landing Page.
 */
export const RotaPublica = ({ children }: { children: React.ReactNode }) => {
  const { usuarioAtual, autenticacaoPronta } = useAuthContext();

  if (!autenticacaoPronta) {
    return null; // Poderia ser um spinner de carregamento global
  }

  if (usuarioAtual) {
    return <Navigate to="/sistema" replace />;
  }

  return <>{children}</>;
};
