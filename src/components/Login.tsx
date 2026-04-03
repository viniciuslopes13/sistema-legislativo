import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Globe } from 'lucide-react';
import { loginWithGoogle, loginWithEmail } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/sistema');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/sistema');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // Redirect is handled by Supabase OAuth
    } catch (error) {
      console.error("Login failed:", error);
      setError('Falha no login com Google.');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await loginWithEmail(email, password);
      navigate('/sistema');
    } catch (err: any) {
      console.error("Email login failed:", err);
      setError('E-mail ou senha inválidos. Se você não tem acesso, entre em contato com o administrador.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200 border border-gray-100 p-10 text-center"
      >
        <div className="bg-blue-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100">
          <ShieldCheck size={32} className="text-white" />
        </div>
        
        <h2 className="text-2xl font-black text-gray-900 mb-1">Acesso Restrito</h2>
        <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">
          Identifique-se para acessar o Sistema Legislativo.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div className="text-left space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              placeholder="seu@email.com"
            />
          </div>
          <div className="text-left space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            Entrar no Sistema
          </button>
        </form>

        <div className="relative flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[10px] font-black text-gray-400 uppercase">ou</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <div className="space-y-3">
          <button 
            onClick={handleGoogleLogin}
            className="w-full py-3.5 bg-white border-2 border-gray-100 rounded-2xl font-bold text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-blue-200 transition-all group text-sm"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            Entrar com Google
          </button>

          <div className="flex justify-center items-center px-2">
            <button 
              onClick={() => navigate('/publico')}
              className="text-xs font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1"
            >
              <Globe size={14} /> Painel Público
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
