import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSGLM } from '../context/SGLMContext';

/**
 * Guard para rotas que exigem autenticação.
 * Exemplo: Todo o sistema interno (/sistema).
 */
export const RotaPrivada = ({ children }: { children: React.ReactNode }) => {
  const { usuarioAtual, autenticacaoPronta } = useSGLM();
  const location = useLocation();

  if (!autenticacaoPronta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!usuarioAtual) {
    // Salvamos a rota que o usuário tentou acessar para redirecioná-lo após o login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
