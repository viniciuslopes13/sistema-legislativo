import React, { useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, MinusCircle, Clock, Users, FileText, LayoutDashboard, LogOut, ChevronRight, Play, UserCheck, SkipForward, Monitor, Building2, Globe, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSGLMRealtime } from './hooks/useSGLMRealtime';
import { formatTime, cn } from './lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import LandingPage from './components/LandingPage';
import Login from './components/Login';

import { logout } from './lib/auth';

// --- Shared Components ---

const Header = ({ user, viewName, camaraNome }: { user: any, viewName: string, camaraNome?: string }) => {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="bg-blue-900 p-2 rounded-lg text-white cursor-pointer" onClick={() => navigate('/')}>
          <LayoutDashboard size={24} />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 leading-tight">
            {camaraNome || 'Câmara Municipal'}
          </h1>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{viewName}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-100">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-tighter">Conectado</span>
        </div>

        <div className="flex items-center gap-3 border-l pl-6 border-gray-200">
          {user ? (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">{user.nome}</p>
                <p className="text-xs text-gray-500">{user.partido} - {user.cargo_mesa || user.perfil || 'Vereador'}</p>
              </div>
              <img src={user.foto_url || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.nome} className="w-10 h-10 rounded-full border-2 border-blue-100 object-cover" referrerPolicy="no-referrer" />
            </>
          ) : (
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900">Visitante</p>
              <p className="text-xs text-gray-500">Acesso Público</p>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

const Sidebar = ({ quorum, currentItem, nextItems, onSelectView, activeView, user }: any) => {
  const canManage = user?.perfil === 'ADMIN' || user?.perfil === 'PRESIDENTE' || user?.perfil === 'SECRETARIO';
  
  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-64px)] sticky top-16">
      <div className="p-6">
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">Quórum Atual</span>
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-blue-900">{quorum.presentes}</span>
            <span className="text-xl font-bold text-blue-300">/{quorum.total}</span>
          </div>
          <p className="text-[10px] text-blue-600 font-medium mt-1 italic">Maioria absoluta presente</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {[
          { id: 'ordem', label: 'Ordem do Dia', icon: FileText },
          { id: 'anteriores', label: 'Votações Anteriores', icon: Clock },
          { id: 'presenca', label: 'Presença Nominal', icon: Users },
          { id: 'documentos', label: 'Documentos', icon: FileText },
          ...(canManage ? [{ id: 'gestao', label: 'Gestão de Usuários', icon: UserCheck }] : []),
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectView(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              activeView === item.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                : "text-gray-500 hover:bg-gray-50 hover:text-blue-600"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-gray-100">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Próximas Matérias</h3>
        <div className="space-y-3">
          {nextItems.map((item: any, i: number) => (
            <div key={item.id} className={cn(
              "p-3 rounded-xl border transition-all",
              i === 0 ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100 opacity-60"
            )}>
              <span className="text-[9px] font-black text-blue-600 uppercase mb-1 block">
                {i === 0 ? 'Em Discussão' : `Item 0${i + 1}`}
              </span>
              <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug">
                {item.titulo_manual}
              </p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

const ManagementView = ({ state }: { state: any }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'camaras'>('users');
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    partido: '',
    perfil: 'VEREADOR' as any,
    camaraId: ''
  });
  const [camaraData, setCamaraData] = useState({
    nome: '',
    cidade: '',
    estado: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await state.createUser(formData);
      setIsAdding(false);
      setFormData({ nome: '', email: '', partido: '', perfil: 'VEREADOR', camaraId: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCamara = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await state.createCamara(camaraData);
      setIsAdding(false);
      setCamaraData({ nome: '', cidade: '', estado: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = state.currentUser?.perfil === 'ADMIN';

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-gray-900">Gestão do Sistema</h2>
            <p className="text-gray-500 font-medium">Gerencie câmaras, parlamentares e acessos</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button 
                onClick={() => { setActiveTab('camaras'); setIsAdding(true); }}
                className={cn(
                  "px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg",
                  activeTab === 'camaras' ? "bg-blue-600 text-white shadow-blue-100" : "bg-white text-gray-600 border border-gray-100"
                )}
              >
                <Building2 size={20} />
                Nova Câmara
              </button>
            )}
            <button 
              onClick={() => { setActiveTab('users'); setIsAdding(true); }}
              className={cn(
                "px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg",
                activeTab === 'users' ? "bg-blue-600 text-white shadow-blue-100" : "bg-white text-gray-600 border border-gray-100"
              )}
            >
              <UserCheck size={20} />
              Novo Usuário
            </button>
          </div>
        </div>

        <div className="flex gap-4 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "px-4 py-2 font-bold text-sm transition-all border-b-2",
              activeTab === 'users' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400"
            )}
          >
            Usuários
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('camaras')}
              className={cn(
                "px-4 py-2 font-bold text-sm transition-all border-b-2",
                activeTab === 'camaras' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400"
              )}
            >
              Câmaras
            </button>
          )}
        </div>

        {isAdding && activeTab === 'users' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100"
          >
            <h3 className="text-xl font-black text-gray-900 mb-6">Cadastrar Novo Usuário</h3>
            {error && <p className="text-red-500 text-sm mb-4 font-bold">{error}</p>}
            <form onSubmit={handleSubmitUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nome Completo</label>
                <input 
                  required
                  value={formData.nome}
                  onChange={e => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="Nome do Parlamentar"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">E-mail</label>
                <input 
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="email@camara.gov.br"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Partido</label>
                <input 
                  required
                  value={formData.partido}
                  onChange={e => setFormData({...formData, partido: e.target.value})}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="Ex: PSB, PT, PL..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Perfil de Acesso</label>
                <select 
                  value={formData.perfil}
                  onChange={e => setFormData({...formData, perfil: e.target.value as any})}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                >
                  <option value="VEREADOR">Vereador</option>
                  {isAdmin && (
                    <>
                      <option value="PRESIDENTE">Presidente da Câmara</option>
                      <option value="SECRETARIO">Secretário</option>
                      <option value="ADMIN">Administrador do Sistema</option>
                    </>
                  )}
                </select>
              </div>
              {isAdmin && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Câmara</label>
                  <select 
                    required
                    value={formData.camaraId}
                    onChange={e => setFormData({...formData, camaraId: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  >
                    <option value="">Selecione uma Câmara</option>
                    {state.camaras.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="md:col-span-2 flex gap-3 pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Usuário'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {isAdding && activeTab === 'camaras' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100"
          >
            <h3 className="text-xl font-black text-gray-900 mb-6">Cadastrar Nova Câmara</h3>
            {error && <p className="text-red-500 text-sm mb-4 font-bold">{error}</p>}
            <form onSubmit={handleSubmitCamara} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nome da Câmara</label>
                <input 
                  required
                  value={camaraData.nome}
                  onChange={e => setCamaraData({...camaraData, nome: e.target.value})}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="Câmara Municipal de..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Cidade</label>
                <input 
                  required
                  value={camaraData.cidade}
                  onChange={e => setCamaraData({...camaraData, cidade: e.target.value})}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Estado</label>
                <input 
                  required
                  maxLength={2}
                  value={camaraData.estado}
                  onChange={e => setCamaraData({...camaraData, estado: e.target.value.toUpperCase()})}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="UF"
                />
              </div>
              <div className="md:col-span-3 flex gap-3 pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Câmara'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Parlamentar</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Câmara</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Perfil</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody>
                {state.parlamentares.map((p: any) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <img src={p.foto_url || `https://i.pravatar.cc/150?u=${p.id}`} className="w-10 h-10 rounded-full border border-gray-100" referrerPolicy="no-referrer" />
                        <div>
                          <p className="font-bold text-gray-900">{p.nome}</p>
                          <p className="text-xs text-gray-500">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4 font-bold text-gray-600">
                      {state.camaras.find((c: any) => c.id === p.camaraId)?.nome || 'N/A'}
                    </td>
                    <td className="px-8 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        p.perfil === 'ADMIN' ? "bg-purple-100 text-purple-700" :
                        p.perfil === 'PRESIDENTE' ? "bg-blue-100 text-blue-700" :
                        p.perfil === 'SECRETARIO' ? "bg-teal-100 text-teal-700" :
                        "bg-gray-100 text-gray-700"
                      )}>
                        {p.perfil}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", p.ativo ? "bg-green-500" : "bg-red-500")} />
                        <span className="text-xs font-bold text-gray-600">{p.ativo ? 'Ativo' : 'Inativo'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><FileText size={18} /></button>
                        {isAdmin && (
                          <button 
                            onClick={() => state.deleteUser(p.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'camaras' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.camaras.map((c: any) => (
              <div key={c.id} className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                      <Building2 size={24} />
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      c.ativo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {c.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-1">{c.nome}</h3>
                  <p className="text-sm text-gray-500 font-medium">{c.cidade} - {c.estado}</p>
                </div>
                <div className="mt-6 flex gap-2">
                  <button className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all">Editar</button>
                  <button 
                    onClick={() => state.deleteCamara(c.id)}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Views ---

const CouncilorView = ({ state }: { state: any }) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [lastVote, setLastVote] = useState<string | null>(null);

  const handleVote = (option: 'SIM' | 'NAO' | 'ABSTER') => {
    state.registerVote(option);
    setHasVoted(true);
    setLastVote(option);
  };

  const currentItem = state.itens[0];

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <Clock size={16} />
          <span>Sessão Plenária Ordinária</span>
          <ChevronRight size={14} />
          <span className="text-blue-600 font-bold">Votação em Curso</span>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100 flex flex-col md:flex-row min-h-[400px]">
          <div className="md:w-2/5 bg-teal-500 relative p-8 flex items-center justify-center overflow-hidden">
            <div className="absolute top-6 left-6 bg-blue-900 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest z-10">
              Regime de Urgência
            </div>
            <img 
              src="https://picsum.photos/seed/legislative/800/800" 
              alt="Matéria" 
              className="w-full h-full object-cover absolute inset-0 opacity-40 mix-blend-overlay"
              referrerPolicy="no-referrer"
            />
            <div className="relative z-10 w-48 h-48 bg-white/20 backdrop-blur-xl rounded-full border border-white/30 flex items-center justify-center">
               <FileText size={80} className="text-white" />
            </div>
          </div>
          
          <div className="md:w-3/5 p-10 flex flex-col justify-center">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Proposta de Lei</span>
              <span className="text-xs font-mono text-gray-400">ID: PL-2023/456</span>
            </div>
            <h2 className="text-4xl font-black text-gray-900 leading-[1.1] mb-6">
              {currentItem.titulo_manual}
            </h2>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Users size={16} className="text-gray-500" />
              </div>
              <p className="text-sm font-bold text-gray-600">
                Autor: <span className="text-gray-900">Vereador Ricardo Santos (PSB)</span>
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resumo da Ementa</h4>
              <p className="text-gray-600 leading-relaxed text-lg">
                {currentItem.ementa_manual}
              </p>
            </div>
          </div>
        </div>

        <div className="text-center space-y-8 py-8">
          <div className="relative inline-block">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Selecione seu voto abaixo</h3>
            <div className="h-1 w-12 bg-blue-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { id: 'SIM', label: 'SIM', sub: 'FAVORÁVEL À PROPOSTA', icon: CheckCircle2, color: 'green' },
              { id: 'NAO', label: 'NÃO', sub: 'CONTRÁRIO À PROPOSTA', icon: XCircle, color: 'red' },
              { id: 'ABSTER', label: 'ABSTER', sub: 'ABSTENÇÃO DE VOTO', icon: MinusCircle, color: 'amber' },
            ].map((opt) => (
              <motion.button
                key={opt.id}
                whileHover={!hasVoted ? { y: -8, scale: 1.02 } : {}}
                whileTap={!hasVoted ? { scale: 0.98 } : {}}
                disabled={hasVoted}
                onClick={() => handleVote(opt.id as any)}
                className={cn(
                  "relative group bg-white p-10 rounded-[2.5rem] shadow-xl transition-all border-b-8 flex flex-col items-center gap-6",
                  hasVoted && lastVote !== opt.id && "opacity-40 grayscale",
                  hasVoted && lastVote === opt.id && "ring-4 ring-offset-4",
                  opt.color === 'green' && (hasVoted && lastVote === opt.id ? "border-green-500 ring-green-500" : "border-green-500 hover:shadow-green-100"),
                  opt.color === 'red' && (hasVoted && lastVote === opt.id ? "border-red-500 ring-red-500" : "border-red-500 hover:shadow-red-100"),
                  opt.color === 'amber' && (hasVoted && lastVote === opt.id ? "border-amber-500 ring-amber-500" : "border-amber-500 hover:shadow-amber-100")
                )}
              >
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                  opt.color === 'green' && "bg-green-50 text-green-500",
                  opt.color === 'red' && "bg-red-50 text-red-500",
                  opt.color === 'amber' && "bg-amber-50 text-amber-500"
                )}>
                  <opt.icon size={40} strokeWidth={3} />
                </div>
                <div className="text-center">
                  <span className={cn(
                    "text-4xl font-black block mb-1",
                    opt.color === 'green' && "text-green-600",
                    opt.color === 'red' && "text-red-600",
                    opt.color === 'amber' && "text-amber-600"
                  )}>{opt.label}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{opt.sub}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 px-8 py-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tempo restante</p>
              <p className="text-lg font-black text-gray-900">{formatTime(state.timeLeft)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quórum</p>
              <p className="text-lg font-black text-gray-900">21/21 Presentes</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2">
            <FileText size={18} />
            Ver Texto Integral
          </button>
          <button className="px-6 py-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors flex items-center gap-2">
            <LayoutDashboard size={18} />
            Painel de Resultados
          </button>
        </div>
      </div>

      <AnimatePresence>
        {hasVoted && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-12 shadow-2xl max-w-md w-full text-center border border-gray-100"
            >
              <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 size={48} strokeWidth={3} />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4">Voto Registrado!</h3>
              <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                Seu voto <span className={cn(
                  "font-black px-2 py-1 rounded-lg",
                  lastVote === 'SIM' && "bg-green-100 text-green-700",
                  lastVote === 'NAO' && "bg-red-100 text-red-700",
                  lastVote === 'ABSTER' && "bg-amber-100 text-amber-700"
                )}>{lastVote}</span> foi processado e armazenado com segurança no banco de dados legislativo.
              </p>
              <button 
                onClick={() => setHasVoted(false)}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PresidentView = ({ state }: { state: any }) => {
  const currentItem = state.itens[0];
  const voteData = [
    { name: 'SIM', value: state.votos.filter((v: any) => v.opcao === 'SIM').length, color: '#22C55E' },
    { name: 'NÃO', value: state.votos.filter((v: any) => v.opcao === 'NAO').length, color: '#EF4444' },
    { name: 'ABSTER', value: state.votos.filter((v: any) => v.opcao === 'ABSTER').length, color: '#EAB308' },
    { name: 'PENDENTE', value: Math.max(0, 15 - state.votos.length), color: '#E5E7EB' },
  ];

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-y-auto flex gap-8">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <span>Sessão 42</span>
            <ChevronRight size={14} />
            <span>Ordem do Dia</span>
            <ChevronRight size={14} />
            <span className="text-blue-600 font-bold">Discussão em Destaque</span>
          </div>
          <button 
            onClick={state.seedDatabase}
            className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-200 transition-colors"
          >
            Inicializar Base de Dados
          </button>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-blue-700 p-8 text-white relative">
            <div className="flex justify-between items-center mb-6">
              <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Matéria em Pauta</span>
              <div className="flex items-center gap-2 font-mono text-xl">
                <Clock size={20} />
                {new Date().toLocaleTimeString()}
              </div>
            </div>
            <h2 className="text-3xl font-black mb-4 leading-tight">{currentItem.titulo_manual}</h2>
            <p className="text-blue-100 text-lg leading-relaxed opacity-90">{currentItem.ementa_manual}</p>
          </div>

          <div className="p-8 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Users size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Autor</p>
                <p className="font-bold text-gray-900">Ver. Paulo Ferreira (PTB)</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Resumo do Parecer</h4>
              <p className="text-gray-600 leading-relaxed italic">
                A Comissão de Constituição e Justiça (CCJ) manifestou parecer favorável por unanimidade. A proposta visa modernizar o laboratório de informática e capacitar docentes para novas tecnologias.
              </p>
            </div>

            <div className="flex gap-4">
              <button onClick={() => state.openVoting(currentItem.id)} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-green-700 transition-colors shadow-lg shadow-green-100">
                <Play size={20} fill="currentColor" /> Abrir Votação
              </button>
              <button className="flex-1 bg-blue-700 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-800 transition-colors shadow-lg shadow-blue-100">
                <UserCheck size={20} /> Registrar Presença
              </button>
              <button className="px-8 bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors">
                Próxima Matéria <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Sessão inicia em', value: '14:00' },
            { label: 'Duração Total', value: '01:35:42' },
            { label: 'Inscritos Fala', value: '04' },
            { label: 'Votos Pendentes', value: '03' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-100 text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="w-80 space-y-6">
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 text-center">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-6">Tempo de Fala</p>
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="bg-gray-50 w-24 py-4 rounded-2xl border border-gray-100">
              <span className="text-4xl font-black text-gray-900 block">04</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase">Min</span>
            </div>
            <span className="text-3xl font-black text-gray-300">:</span>
            <div className="bg-gray-50 w-24 py-4 rounded-2xl border border-gray-100">
              <span className="text-4xl font-black text-gray-900 block">28</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase">Seg</span>
            </div>
          </div>
          <button className="w-full py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-100 transition-colors">
            Reiniciar Cronômetro
          </button>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 text-center">Placar Parcial</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={voteData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {voteData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {voteData.map(v => (
              <div key={v.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: v.color }} />
                <span className="text-xs font-bold text-gray-600">{v.name}: {v.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SecretaryView = ({ state }: { state: any }) => {
  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-gray-900">Console do Secretário</h2>
            <p className="text-gray-500 font-medium">Controle de rito e gerenciamento de sessão</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fase Atual</p>
              <p className="font-black text-blue-600">{state.currentFase.nome_fase}</p>
            </div>
            <button onClick={state.advanceFase} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
              <SkipForward size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 space-y-6">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Clock className="text-blue-600" /> Cronômetro
            </h3>
            <div className="text-center py-8 bg-gray-50 rounded-3xl border border-gray-100">
              <span className="text-6xl font-black text-gray-900 tabular-nums">{formatTime(state.timeLeft)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors">Pausar</button>
              <button className="py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-colors">Resetar</button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 space-y-6">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Users className="text-blue-600" /> Presença Nominal
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {state.parlamentares.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <img src={p.foto_url} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                    <span className="text-xs font-bold text-gray-900">{p.nome}</span>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
              ))}
            </div>
            <button className="w-full py-4 bg-blue-50 text-blue-700 rounded-2xl font-bold hover:bg-blue-100 transition-colors">Chamada Geral</button>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 space-y-6">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <FileText className="text-blue-600" /> Votação
            </h3>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Item Atual</p>
              <p className="text-sm font-bold text-gray-900 line-clamp-2">{state.itens[0].titulo_manual}</p>
            </div>
            <div className="space-y-3">
              <button onClick={() => state.openVoting(state.itens[0].id)} className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                <Play size={18} fill="currentColor" /> Iniciar Votação
              </button>
              <button onClick={state.closeVoting} className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors">Encerrar Votação</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PublicView = ({ state }: { state: any }) => {
  const currentItem = state.itens[0];
  const sim = state.votos.filter((v: any) => v.opcao === 'SIM').length;
  const nao = state.votos.filter((v: any) => v.opcao === 'NAO').length;
  const abster = state.votos.filter((v: any) => v.opcao === 'ABSTER').length;
  const voteData = [
    { name: 'SIM', value: sim, color: '#22C55E' },
    { name: 'NÃO', value: nao, color: '#EF4444' },
    { name: 'ABSTER', value: abster, color: '#EAB308' },
  ];

  return (
    <div className="flex-1 bg-blue-950 p-12 overflow-y-auto text-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 h-full">
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-6">
            <div className="inline-block bg-blue-800/50 backdrop-blur-md px-6 py-2 rounded-full text-sm font-black uppercase tracking-[0.3em] border border-blue-700/50">Matéria em Votação</div>
            <h2 className="text-6xl font-black leading-tight">{currentItem.titulo_manual}</h2>
            <p className="text-2xl text-blue-200 leading-relaxed font-medium">{currentItem.ementa_manual}</p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] p-10 border border-white/10 text-center">
              <p className="text-xs font-black text-blue-400 uppercase tracking-[0.4em] mb-6">Tempo de Sessão</p>
              <span className="text-8xl font-black tabular-nums block mb-2">{formatTime(state.timeLeft)}</span>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(state.timeLeft / 3600) * 100}%` }} className="h-full bg-blue-500" />
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] p-10 border border-white/10 text-center">
              <p className="text-xs font-black text-blue-400 uppercase tracking-[0.4em] mb-6">Quórum Presente</p>
              <span className="text-8xl font-black tabular-nums block mb-2">21</span>
              <p className="text-blue-400 font-bold uppercase tracking-widest">Vereadores</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[3rem] p-10 text-gray-900 shadow-2xl">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.4em] mb-10 text-center">Placar em Tempo Real</h3>
            <div className="h-64 w-full mb-10">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={voteData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                    {voteData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {[
                { label: 'SIM', value: sim, color: 'bg-green-500', text: 'text-green-600' },
                { label: 'NÃO', value: nao, color: 'bg-red-500', text: 'text-red-600' },
                { label: 'ABSTER', value: abster, color: 'bg-amber-500', text: 'text-amber-600' },
              ].map((v) => (
                <div key={v.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-4 h-4 rounded-full", v.color)} />
                    <span className="font-black text-gray-500">{v.label}</span>
                  </div>
                  <span className={cn("text-2xl font-black", v.text)}>{v.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-900/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10">
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6">Presença em Plenário</h4>
            <div className="grid grid-cols-4 gap-3">
              {state.parlamentares.map((p: any) => (
                <div key={p.id} className="relative group">
                  <img src={p.foto_url} className="w-full aspect-square rounded-2xl object-cover border-2 border-green-500/50" referrerPolicy="no-referrer" />
                  <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-blue-900" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Layouts ---

const InternalSystem = () => {
  const state = useSGLMRealtime();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('ordem');
  const [demoRole, setDemoRole] = useState<'VEREADOR' | 'PRESIDENTE' | 'SECRETARIO'>('VEREADOR');

  if (!state.isAuthReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Iniciando Sistema...</p>
        </div>
      </div>
    );
  }

  if (!state.currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-12 text-center shadow-xl border border-gray-100">
          <XCircle size={64} className="text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-gray-900 mb-4">Acesso Negado</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">Você não possui um perfil cadastrado no sistema. Entre em contato com o administrador da sua câmara para solicitar acesso.</p>
          <button 
            onClick={() => navigate('/login')} 
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  const renderView = () => {
    if (activeView === 'gestao') return <ManagementView state={state} />;

    switch (demoRole) {
      case 'VEREADOR': return <CouncilorView state={state} />;
      case 'PRESIDENTE': return <PresidentView state={state} />;
      case 'SECRETARIO': return <SecretaryView state={state} />;
      default: return <CouncilorView state={state} />;
    }
  };

  const viewName = {
    'VEREADOR': 'Sistema de Votação Eletrônica',
    'PRESIDENTE': 'Painel da Presidência',
    'SECRETARIO': 'Console de Controle'
  }[demoRole];

  const camara = state.camaras.find((c: any) => c.id === state.currentUser?.camaraId);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <Header user={state.currentUser} viewName={viewName} camaraNome={camara?.nome} />
      <div className="flex flex-1">
        <Sidebar 
          quorum={{ presentes: 12, total: 15 }} 
          currentItem={state.itens[0]} 
          nextItems={state.itens.slice(1)} 
          onSelectView={setActiveView} 
          activeView={activeView}
          user={state.currentUser}
        />
        {renderView()}
      </div>
      <div className="fixed bottom-24 right-8 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-gray-200 flex flex-col gap-2 z-50">
        <p className="text-[8px] font-black text-gray-400 uppercase text-center mb-1">Demo View</p>
        <button onClick={() => setDemoRole('VEREADOR')} className={cn("px-4 py-2 rounded-xl text-[10px] font-bold transition-all", demoRole === 'VEREADOR' ? "bg-blue-600 text-white" : "hover:bg-gray-100")}>Vereador</button>
        <button onClick={() => setDemoRole('PRESIDENTE')} className={cn("px-4 py-2 rounded-xl text-[10px] font-bold transition-all", demoRole === 'PRESIDENTE' ? "bg-blue-600 text-white" : "hover:bg-gray-100")}>Presidente</button>
        <button onClick={() => setDemoRole('SECRETARIO')} className={cn("px-4 py-2 rounded-xl text-[10px] font-bold transition-all", demoRole === 'SECRETARIO' ? "bg-blue-600 text-white" : "hover:bg-gray-100")}>Secretário</button>
      </div>
    </div>
  );
};

const PublicScreen = () => {
  const { camaraId } = useParams();
  const state = useSGLMRealtime(camaraId);

  if (!state.isAuthReady) {
    return (
      <div className="min-h-screen bg-blue-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-blue-400 uppercase tracking-widest">Conectando ao Telão...</p>
        </div>
      </div>
    );
  }

  const camara = state.camaras.find(c => c.id === camaraId);

  return (
    <div className="min-h-screen bg-blue-950 flex flex-col">
      <Header user={state.currentUser} viewName="Painel Público de Transmissão" camaraNome={camara?.nome} />
      <PublicView state={state} />
    </div>
  );
};

const CamaraSelection = () => {
  const state = useSGLMRealtime();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredCamaras = state.camaras.filter(c => 
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.cidade.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-12 pt-12">
        <div className="text-center space-y-4">
          <div className="bg-blue-900 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-100">
            <Globe size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Painel Público</h1>
          <p className="text-lg text-gray-500 font-medium">Selecione uma Câmara para acompanhar as sessões em tempo real</p>
        </div>

        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nome ou cidade..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white rounded-3xl shadow-xl border border-gray-100 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-lg font-medium"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCamaras.map(c => (
            <motion.button
              key={c.id}
              whileHover={{ y: -5 }}
              onClick={() => navigate(`/publico/${c.id}`)}
              className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 text-left flex items-center justify-between group hover:border-blue-200 transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Building2 size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">{c.nome}</h3>
                  <p className="text-gray-500 font-bold">{c.cidade} - {c.estado}</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-blue-600 transition-all" size={24} />
            </motion.button>
          ))}
          {filteredCamaras.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400 font-bold">Nenhuma Câmara encontrada.</p>
            </div>
          )}
        </div>

        <div className="text-center">
          <button 
            onClick={() => navigate('/')}
            className="text-sm font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
          >
            Voltar para o Início
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/sistema" element={<InternalSystem />} />
      <Route path="/publico" element={<CamaraSelection />} />
      <Route path="/publico/:camaraId" element={<PublicScreen />} />
    </Routes>
  );
}
