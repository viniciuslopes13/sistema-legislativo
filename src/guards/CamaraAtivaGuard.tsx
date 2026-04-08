import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useGestaoContext } from '../context/GestaoContext';

/**
 * Guard que verifica se a Câmara Municipal do usuário está ativa.
 * Impede o acesso caso a instituição tenha sido suspensa.
 */
export const CamaraAtivaGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuarioAtual } = useAuthContext();
  const { camaras } = useGestaoContext();

  // Administradores globais podem acessar mesmo que a câmara local esteja inativa para manutenção
  if (usuarioAtual?.temPermissao('SISTEMA_ADMINISTRAR_TENANTS')) return <>{children}</>;

  const minhaCamara = camaras.find(c => c.id === usuarioAtual?.camara_id);

  if (minhaCamara && !minhaCamara.ativo) {
    // Redireciona para uma página de aviso (ou para o login com mensagem)
    // Por enquanto, usaremos o redirecionamento para o login
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
