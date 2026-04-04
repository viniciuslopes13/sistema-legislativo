import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { autenticacaoService } from '../../services/autenticacao.service';

/**
 * Página de Primeiro Acesso (Troca de Senha Provisória).
 */
export const PrimeiroAcessoPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { email, userId } = location.state || {};

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) throw authError;

      const { error: dbError } = await supabase
        .from('usuarios')
        .update({ senha_alterada: true, senha_provisoria: null, ativo: true })
        .eq('id', userId);
      
      if (dbError) throw dbError;

      alert('Senha alterada com sucesso! Por favor, faça login novamente.');
      await autenticacaoService.logout();
      navigate('/login');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!email) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-2">Primeiro Acesso</h2>
        <p className="text-slate-400 mb-6">Olá {email}, por segurança você precisa definir uma nova senha definitiva.</p>
        
        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            placeholder="Nova senha"
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl"
          >
            Definir Senha e Acessar
          </button>
        </form>
      </div>
    </div>
  );
};
