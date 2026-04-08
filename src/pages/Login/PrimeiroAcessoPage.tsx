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
        .update({ senha_alterada: true, ativo: true })
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] p-10 shadow-xl border border-gray-100">
        <h2 className="text-3xl font-black text-gray-900 mb-2">Primeiro Acesso</h2>
        <p className="text-gray-500 font-medium mb-8">Olá <span className="font-bold text-gray-700">{email}</span>, por segurança você precisa definir uma nova senha definitiva.</p>
        
        <form onSubmit={handleReset} className="space-y-6">
          <input
            type="password"
            placeholder="Digite a nova senha..."
            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-gray-700 transition-all"
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
