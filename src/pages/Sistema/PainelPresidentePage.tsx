import React, { useState } from 'react';
import { 
  Play, FastForward, 
  FileText, Calendar, Plus, 
  XCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

// Importação dos Componentes Reutilizáveis
import { CronometroFase } from '../../components/Legislativo/CronometroFase';
import { useAuthContext } from '../../context/AuthContext';
import { useGestaoContext } from '../../context/GestaoContext';
import { useSessaoAtivaContext } from '../../context/SessaoAtivaContext';

export const PainelPresidentePage = () => {
  const auth = useAuthContext();
  const gestao = useGestaoContext();
  const sessaoCtx = useSessaoAtivaContext();
  
  const state = { ...auth, ...gestao, ...sessaoCtx };
  const [activeSubTab, setActiveTab] = useState<'controle' | 'agenda'>('controle');
  const [isScheduling, setIsScheduling] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [scheduleData, setScheduleData] = useState({
    data: new Date().toISOString().split('T')[0],
    hora: '19:00',
    template_id: ''
  });

  const canOpenSessao = state.usuarioAtual?.temPermissao('SESSAO_ABRIR');

  const handleCreateSessao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleData.template_id) return alert('Selecione um rito (template).');
    
    setLoading(true);
    try {
      await state.criarSessao({
        data_inicio: `${scheduleData.data}T${scheduleData.hora}:00Z`,
        template_id: scheduleData.template_id
      });
      setIsScheduling(false);
      alert('Sessão agendada com sucesso!');
    } catch (err: any) {
      alert(`Erro ao agendar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSessao = async (id: string) => {
    if (!canOpenSessao) return;
    try {
      await state.abrirSessao(id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-y-auto min-h-full">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-gray-900">Console da Presidência</h2>
            <p className="text-gray-500 font-medium">Gestão de sessões, rito e votações em tempo real</p>
          </div>
          <div className="flex bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
            <button 
              onClick={() => setActiveTab('controle')}
              className={cn("px-6 py-2.5 rounded-xl text-sm font-bold transition-all", activeSubTab === 'controle' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-blue-600")}
            >
              Sessão Atual
            </button>
            <button 
              onClick={() => setActiveTab('agenda')}
              className={cn("px-6 py-2.5 rounded-xl text-sm font-bold transition-all", activeSubTab === 'agenda' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-blue-600")}
            >
              Agenda / Agendamento
            </button>
          </div>
        </div>

        {activeSubTab === 'controle' && (
          <>
            {!state.sessao ? (
              <div className="h-[60vh] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-gray-200 shadow-xl p-12 text-center">
                <div className="bg-blue-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8">
                  <Calendar size={48} className="text-blue-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Nenhuma sessão em curso</h3>
                <p className="text-gray-500 max-w-md mb-8">Para iniciar os trabalhos legislativos, você deve abrir uma sessão agendada na aba "Agenda".</p>
                <button 
                  onClick={() => setActiveTab('agenda')}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                >
                  Ver Agenda de Sessões
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">Fase Atual</span>
                        <h3 className="text-3xl font-black text-gray-900 mt-2">{state.faseAtual?.nome_fase}</h3>
                      </div>
                      <div className="text-right">
                        <CronometroFase segundos={state.tempoRestante} />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {state.usuarioAtual?.temPermissao('SESSAO_AVANCAR') && (
                        <button 
                          onClick={state.avancarFase}
                          className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >
                          <FastForward size={20} />
                          Próxima Fase
                        </button>
                      )}
                      
                      {state.usuarioAtual?.temPermissao('SESSAO_ENCERRAR') && (
                        <button 
                          onClick={() => state.encerrarSessao(state.sessao.id)}
                          className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-100 transition-all border border-red-100"
                        >
                          Encerrar Sessão
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
                      <h3 className="text-xl font-black text-gray-900">Ordem do Dia / Pauta</h3>
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                        <FileText size={20} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      {state.itens.map((item: any) => (
                        <div key={item.id} className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex items-center justify-between group hover:bg-gray-50 transition-colors">
                          <div className="flex-1 mr-8">
                            <h4 className="font-bold text-gray-900 leading-tight">{item.titulo_manual}</h4>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.ementa_manual}</p>
                          </div>
                          {state.faseAtual?.permite_votacao && state.usuarioAtual?.temPermissao('VOTACAO_INICIAR') && (
                            <button 
                              onClick={() => state.iniciarVotacao(item.id)}
                              disabled={state.votacaoAtiva?.item_id === item.id}
                              className={cn(
                                "px-6 py-3 rounded-xl font-black text-xs transition-all",
                                state.votacaoAtiva?.item_id === item.id 
                                  ? "bg-green-100 text-green-600 cursor-default"
                                  : "bg-white text-blue-600 border border-blue-100 shadow-sm hover:bg-blue-600 hover:text-white"
                              )}
                            >
                              {state.votacaoAtiva?.item_id === item.id ? 'EM VOTAÇÃO' : 'ABRIR VOTAÇÃO'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Resultado Votação Atual */}
                  {state.votacaoAtiva && state.resultadoVotacao && (
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200">
                      <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">Apuração em Tempo Real</h3>
                      <div className="space-y-4">
                         <div className="flex justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                           <span className="font-black text-green-700">SIM</span>
                           <span className="font-black text-green-700">{state.resultadoVotacao.sim}</span>
                         </div>
                         <div className="flex justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                           <span className="font-black text-red-700">NÃO</span>
                           <span className="font-black text-red-700">{state.resultadoVotacao.nao}</span>
                         </div>
                         <div className="flex justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                           <span className="font-black text-amber-700">ABSTENÇÕES</span>
                           <span className="font-black text-amber-700">{state.resultadoVotacao.abstencoes}</span>
                         </div>
                         
                         <div className="mt-6 pt-6 border-t border-gray-100">
                           <p className="text-xs text-gray-500 mb-2">Status da Matéria: <span className="font-bold">{state.votacaoAtiva.tipo_quorum.replace('_', ' ')}</span></p>
                           <div className={cn("p-4 rounded-xl font-black text-center text-sm", state.resultadoVotacao.aprovado ? "bg-green-600 text-white shadow-lg shadow-green-200" : "bg-gray-100 text-gray-600")}>
                             {state.resultadoVotacao.aprovado ? 'APROVADO' : 'REJEITADO (ou aguardando)'}
                           </div>
                           <p className="text-center text-[10px] font-bold text-gray-400 mt-2">{state.resultadoVotacao.motivo}</p>
                         </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">Presença Nominal</h3>
                    <div className="space-y-3">
                      {state.parlamentares.map((p: any) => {
                        const isPresent = state.presencas.some((pr: any) => pr.usuario_id === p.id);
                        return (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-sm font-bold text-gray-700 truncate mr-4">{p.nome}</span>
                            <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", isPresent ? "bg-green-500" : "bg-red-400")} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeSubTab === 'agenda' && (
          <div className="space-y-8">
            {!state.usuarioAtual?.temPermissao('SESSAO_AGENDAR') ? (
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-200 text-center">
                <h3 className="text-2xl font-black text-gray-900 mb-2">Acesso Restrito</h3>
                <p className="text-gray-500">Você não possui a operação SESSAO_AGENDAR ativa no seu perfil.</p>
              </div>
            ) : isScheduling ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-200">
                <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
                  <h3 className="text-2xl font-black text-gray-900">Agendar Nova Sessão</h3>
                  <button onClick={() => setIsScheduling(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><XCircle size={24}/></button>
                </div>
                <form onSubmit={handleCreateSessao} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Data da Sessão</label>
                    <input type="date" required value={scheduleData.data} onChange={e => setScheduleData({...scheduleData, data: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Hora de Início</label>
                    <input type="time" required value={scheduleData.hora} onChange={e => setScheduleData({...scheduleData, hora: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-gray-700" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Rito Legislativo (Template)</label>
                    <select required value={scheduleData.template_id} onChange={e => setScheduleData({...scheduleData, template_id: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-gray-700">
                      <option value="">Selecione um rito...</option>
                      {state.templates.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 flex gap-4 pt-4">
                    <button type="submit" disabled={loading} className="flex-1 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">
                      {loading ? 'Processando...' : 'Confirmar Agendamento'}
                    </button>
                    <button type="button" onClick={() => setIsScheduling(false)} className="px-10 py-4 bg-gray-100 text-gray-600 rounded-[1.5rem] font-black hover:bg-gray-200 transition-all border border-gray-200">Cancelar</button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-gray-900">Sessões Agendadas</h3>
                  <button 
                    onClick={() => setIsScheduling(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                  >
                    <Plus size={20} /> Agendar Sessão
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {state.sessoesAgendadas.length === 0 ? (
                    <div className="md:col-span-2 p-12 bg-white rounded-[2rem] border border-gray-200 text-center">
                      <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Nenhuma sessão agendada</p>
                    </div>
                  ) : (
                    state.sessoesAgendadas.map((s: any) => (
                      <div key={s.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200 group hover:border-blue-200 transition-all">
                        <div className="flex justify-between items-start mb-6">
                          <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Calendar size={28} />
                          </div>
                          <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase border border-amber-100">Aguardando</span>
                        </div>
                        <h4 className="text-xl font-black text-gray-900 mb-1">
                          {new Date(s.data_inicio).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                        </h4>
                        <p className="text-gray-500 font-bold text-lg mb-8">Início às {new Date(s.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                        
                        {canOpenSessao ? (
                          <button 
                            onClick={() => handleOpenSessao(s.id)}
                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                          >
                            <Play size={20} fill="currentColor" />
                            Abrir Sessão Agora
                          </button>
                        ) : (
                          <div className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-center text-xs border border-gray-100">
                            Apenas o Presidente pode abrir
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
