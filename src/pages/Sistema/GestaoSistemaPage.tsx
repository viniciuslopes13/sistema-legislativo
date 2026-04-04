import React, { useState, useMemo } from 'react';
import { 
  UserCheck, Building2, XCircle, Edit2, Save, 
  RotateCcw, Shield, Plus, Search, Trash2, 
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { usuarioService } from '../../services/usuario.service';
import { camaraService } from '../../services/camara.service';

// Novos componentes de interface
import { ConfirmModal } from '../../components/UI/ConfirmModal';
import { useToast } from '../../context/ToastContext';

/**
 * Página de Gestão do Sistema (Tema Claro).
 * Atualizada com Modais de Confirmação e Toasts.
 */
export const GestaoSistemaPage = ({ state }: { state: any }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'camaras'>('users');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados de Busca e Paginação
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Estados dos Modais
  const [modalExcluir, setModalExcluir] = useState<{ open: boolean, id: string, nome: string, type: 'user' | 'camara' }>({
    open: false, id: '', nome: '', type: 'user'
  });

  const [formData, setFormData] = useState({
    nome: '', email: '', whatsapp: '', partido: '', 
    perfil: 'VEREADOR', camara_id: state.usuarioAtual?.camara_id || '',
    ativo: true, cargo_mesa: '', is_suplente: false, em_exercicio: true
  });

  const [camaraData, setCamaraData] = useState({
    nome: '', cidade: '', estado: '', ativo: true
  });

  const isAdmin = state.usuarioAtual?.eAdminGlobal();

  const resetUserForm = () => {
    setFormData({
      nome: '', email: '', whatsapp: '', partido: '', 
      perfil: 'VEREADOR', camara_id: state.usuarioAtual?.camara_id || '',
      ativo: true, cargo_mesa: '', is_suplente: false, em_exercicio: true
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleEditUser = (user: any) => {
    setFormData({
      nome: user.nome, email: user.email, whatsapp: user.whatsapp || '',
      partido: user.partido || '', perfil: user.perfil || 'VEREADOR',
      camara_id: user.camara_id, ativo: user.ativo, cargo_mesa: user.cargo_mesa || '',
      is_suplente: user.is_suplente || false, em_exercicio: user.em_exercicio ?? true
    });
    setEditingId(user.id);
    setIsAdding(true);
    setActiveTab('users');
  };

  const handleEditCamara = (camara: any) => {
    setCamaraData({ nome: camara.nome, cidade: camara.cidade, estado: camara.estado, ativo: camara.ativo });
    setEditingId(camara.id);
    setIsAdding(true);
    setActiveTab('camaras');
  };

  // --- Funções de Exclusão ---
  const confirmarExclusao = async () => {
    setLoading(true);
    try {
      if (modalExcluir.type === 'user') {
        await usuarioService.excluirUsuario(modalExcluir.id);
        showToast('Usuário excluído com sucesso!');
      } else {
        await camaraService.excluirCamara(modalExcluir.id);
        showToast('Câmara excluída com sucesso!');
      }
      setModalExcluir({ ...modalExcluir, open: false });
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- FILTRO E PAGINAÇÃO ---
  const usuariosFiltrados = useMemo(() => {
    const todos = isAdmin 
      ? state.parlamentares 
      : (state.parlamentares || []).filter((p: any) => p.camara_id === state.usuarioAtual?.camara_id);
    
    return (todos || []).filter((u: any) => 
      u.nome.toLowerCase().includes(busca.toLowerCase()) || 
      u.email.toLowerCase().includes(busca.toLowerCase())
    );
  }, [state.parlamentares, state.usuarioAtual?.camara_id, busca, isAdmin]);

  const totalPaginasUsers = Math.ceil(usuariosFiltrados.length / itensPorPagina);
  const usuariosPaginados = usuariosFiltrados.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  const camarasFiltradas = useMemo(() => {
    return (state.camaras || []).filter((c: any) => 
      c.nome.toLowerCase().includes(busca.toLowerCase()) || 
      c.cidade.toLowerCase().includes(busca.toLowerCase())
    );
  }, [state.camaras, busca]);

  const totalPaginasCamaras = Math.ceil(camarasFiltradas.length / itensPorPagina);
  const camarasPaginadas = camarasFiltradas.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await state.atualizarUsuario(editingId, formData);
        showToast('Usuário atualizado!');
      } else {
        const finalData = isAdmin ? formData : { ...formData, camara_id: state.usuarioAtual?.camara_id };
        const result = await state.criarUsuario(finalData, formData.perfil);
        if (result?.senhaProvisoria) showToast(`Usuário criado! SENHA: ${result.senhaProvisoria}`, 'info');
        else showToast('Usuário cadastrado com sucesso!');
      }
      resetUserForm();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCamara = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await state.atualizarCamara(editingId, camaraData);
        showToast('Câmara atualizada!');
      } else {
        await state.criarCamara(camaraData);
        showToast('Câmara cadastrada!');
      }
      setIsAdding(false);
      setEditingId(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-y-auto min-h-full pb-20">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div>
            <h2 className="text-3xl font-black text-gray-900 leading-tight">Gestão de Acessos</h2>
            <p className="text-gray-500 font-medium">Controle administrativo do SGLM</p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <button 
                onClick={() => { resetUserForm(); setActiveTab('camaras'); setIsAdding(true); }} 
                className={cn("px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg", activeTab === 'camaras' && isAdding && !editingId ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-100")}
              >
                <Building2 size={20} /> Nova Câmara
              </button>
            )}
            <button 
              onClick={() => { resetUserForm(); setActiveTab('users'); setIsAdding(true); }} 
              className={cn("px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg", activeTab === 'users' && isAdding && !editingId ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-100")}
            >
              <UserCheck size={20} /> Novo Usuário
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-2 p-1 bg-white rounded-2xl border border-gray-200 shadow-sm w-fit">
            <button onClick={() => { setActiveTab('users'); setPaginaAtual(1); setBusca(''); }} className={cn("px-6 py-2.5 rounded-xl text-sm font-bold transition-all", activeTab === 'users' ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-blue-600")}>Usuários</button>
            {isAdmin && (
              <button 
                onClick={() => { setActiveTab('camaras'); setPaginaAtual(1); setBusca(''); }} 
                className={cn("px-6 py-2.5 rounded-xl text-sm font-bold transition-all", activeTab === 'camaras' ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-blue-600")}
              >
                Câmaras
              </button>
            )}
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder={`Pesquisar...`} value={busca} onChange={(e) => { setBusca(e.target.value); setPaginaAtual(1); }} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-gray-700 shadow-sm" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isAdding ? (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-200">
               <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
                  <h3 className="text-2xl font-black text-gray-900">{editingId ? 'Editar Registro' : 'Novo Cadastro'}</h3>
                  <button onClick={() => setIsAdding(false)} className="p-2 text-gray-400 hover:text-red-500"><XCircle size={24}/></button>
               </div>
               <form onSubmit={activeTab === 'users' ? handleSubmitUser : handleSubmitCamara} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeTab === 'camaras' ? (
                    <>
                      <div className="md:col-span-2"><input required value={camaraData.nome} onChange={e => setCamaraData({...camaraData, nome: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold" placeholder="Nome da Câmara" /></div>
                      <input required value={camaraData.cidade} onChange={e => setCamaraData({...camaraData, cidade: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold" placeholder="Cidade" />
                      <input required value={camaraData.estado} onChange={e => setCamaraData({...camaraData, estado: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold" placeholder="Estado" />
                    </>
                  ) : (
                    <>
                      <input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold" placeholder="Nome Completo" />
                      <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold" placeholder="E-mail" disabled={!!editingId} />
                      <input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold" placeholder="WhatsApp" />
                      <input value={formData.partido} onChange={e => setFormData({...formData, partido: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold" placeholder="Partido" />
                      {isAdmin && !editingId && (
                        <select value={formData.perfil} onChange={e => setFormData({...formData, perfil: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold text-gray-700">
                          <option value="VEREADOR">Vereador</option>
                          <option value="PRESIDENTE">Presidente da Câmara</option>
                          <option value="SECRETARIO">Secretário</option>
                          <option value="ADMIN">Administrador Global</option>
                        </select>
                      )}
                      {isAdmin && !editingId && (
                        <select required value={formData.camara_id} onChange={e => setFormData({...formData, camara_id: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold text-gray-700">
                          <option value="">Selecione a Câmara</option>
                          {state.camaras.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      )}
                    </>
                  )}
                  <div className="md:col-span-2 flex gap-4 pt-6 border-t border-gray-100">
                    <button type="submit" disabled={loading} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all">{loading ? 'Processando...' : 'Confirmar Alterações'}</button>
                    <button type="button" onClick={() => setIsAdding(false)} className="px-10 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all">Cancelar</button>
                  </div>
               </form>
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-center">
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">{activeTab === 'users' ? 'Usuário / Parlamentar' : 'Câmara / Instituição'}</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeTab === 'users' ? usuariosPaginados.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <p className="font-black text-gray-900">{p.nome}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-medium">
                            <span>{p.email}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-blue-600 font-bold uppercase text-[9px] bg-blue-50 px-2 py-0.5 rounded">{p.perfil}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center justify-center gap-1.5 w-fit mx-auto", p.ativo ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100")}>
                            <div className={cn("w-1.5 h-1.5 rounded-full", p.ativo ? "bg-green-500" : "bg-red-500")} />
                            {p.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => state.resetarSenhaUsuario(p.id).then((pass: string) => showToast(`Nova Senha: ${pass}`, 'info'))} className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Resetar Senha"><RotateCcw size={18}/></button>
                            <button onClick={() => handleEditUser(p)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Editar"><Edit2 size={18}/></button>
                            <button onClick={() => setModalExcluir({ open: true, id: p.id, nome: p.nome, type: 'user' })} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Excluir"><Trash2 size={18}/></button>
                          </div>
                        </td>
                      </tr>
                    )) : camarasPaginadas.map((c: any) => (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <p className="font-black text-gray-900">{c.nome}</p>
                          <p className="text-xs text-gray-500 font-medium">{c.cidade} - {c.estado}</p>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center justify-center gap-1.5 w-fit mx-auto", c.ativo ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100")}>
                            <div className={cn("w-1.5 h-1.5 rounded-full", c.ativo ? "bg-green-500" : "bg-red-500")} />
                            {c.ativo ? 'Ativa' : 'Suspensa'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => handleEditCamara(c)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Editar"><Edit2 size={18}/></button>
                            <button onClick={() => setModalExcluir({ open: true, id: c.id, nome: c.nome, type: 'camara' })} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Excluir"><Trash2 size={18}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {(activeTab === 'users' ? usuariosFiltrados.length : camarasFiltradas.length) === 0 && (
                  <div className="py-20 text-center text-gray-400 font-black uppercase text-xs tracking-widest">Nenhum resultado encontrado</div>
                )}
              </div>

              {/* Paginação */}
              <div className="flex justify-between items-center px-4">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total: {activeTab === 'users' ? usuariosFiltrados.length : camarasFiltradas.length} itens</p>
                <div className="flex items-center gap-4">
                  <button disabled={paginaAtual === 1} onClick={() => setPaginaAtual(p => p - 1)} className="p-2.5 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-colors shadow-sm"><ChevronLeft size={20} /></button>
                  <span className="text-sm font-black text-gray-700 uppercase tracking-tighter">Página {paginaAtual} de {activeTab === 'users' ? Math.max(1, totalPaginasUsers) : Math.max(1, totalPaginasCamaras)}</span>
                  <button disabled={paginaAtual === (activeTab === 'users' ? totalPaginasUsers : totalPaginasCamaras)} onClick={() => setPaginaAtual(p => p + 1)} className="p-2.5 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-colors shadow-sm"><ChevronRight size={20} /></button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Confirmação Unificado */}
        <ConfirmModal 
          isOpen={modalExcluir.open}
          onClose={() => setModalExcluir({ ...modalExcluir, open: false })}
          onConfirm={confirmarExclusao}
          loading={loading}
          title={modalExcluir.type === 'user' ? 'Excluir Usuário' : 'Excluir Câmara'}
          message={`Tem certeza que deseja excluir "${modalExcluir.nome}"? Esta ação é irreversível e será validada pelo sistema.`}
          confirmText="Excluir Permanentemente"
        />
      </div>
    </div>
  );
};
