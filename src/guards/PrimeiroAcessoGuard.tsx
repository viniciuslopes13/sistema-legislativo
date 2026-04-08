import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

/**
 * Guard específico para a tela de Redefinição de Senha Primeiro Acesso.
 * Ele previne que pessoas que não possuam sessão acessem (jogando-os para /login),
 * e previne que pessoas que já trocaram suas senhas retornem (jogando-as para /sistema).
 */
export const PrimeiroAcessoGuard = ({ children }: { children: React.ReactNode }) => {
  const { usuarioAtual, autenticacaoPronta } = useAuthContext();

  if (!autenticacaoPronta) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Não está logado -> Vai pro Login.
  if (!usuarioAtual) {
    return <Navigate to="/login" replace />;
  }

  // 2. Está logado, mas já tem a senha alterada real -> Vai pro Sistema.
  if (usuarioAtual.senha_alterada === true) {
    return <Navigate to="/sistema" replace />;
  }

  // 3. Está logado e AINDA não tem senha alterada (isProvisional) -> Liberado.
  return <>{children}</>;
};
