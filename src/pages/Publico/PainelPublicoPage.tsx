import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSGLM } from '../../context/SGLMContext'; // Usando o novo contexto
import { IndicadorQuorum } from '../../components/Legislativo/IndicadorQuorum';
import { ItemPautaDestaque } from '../../components/Legislativo/ItemPautaDestaque';
import { Building2, Search, Monitor, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Página do Painel Público.
 * Consome os dados do Contexto Global.
 */
export const PainelPublicoPage = () => {
  const { camaraId } = useParams<{ camaraId: string }>();
  const navigate = useNavigate();
  const state = useSGLM(); // Estado compartilhado
  
  const { faseAtual, itens, quorum, autenticacaoPronta, camaras } = state;
  const [termoPesquisa, setTermoPesquisa] = useState('');
  
  const itemAtual = itens?.[0];

  const camarasFiltradas = camaras.filter(c => 
    c.nome.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    c.cidade.toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  // Se não houver ID na URL, mostramos a seleção
  if (!camaraId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col p-8 md:p-16">
        <div className="max-w-6xl mx-auto w-full space-y-12">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-blue-600 font-bold transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Voltar ao Portal Principal
          </button>

          <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
                <Monitor size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Painel de Transparência</h1>
                <p className="text-gray-500 font-medium uppercase text-xs tracking-widest">Sintonize sua Câmara Municipal</p>
              </div>
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text"
                placeholder="Pesquisar câmara ou cidade..."
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm font-bold text-gray-700"
              />
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {camarasFiltradas.length > 0 ? camarasFiltradas.map(c => (
              <button 
                key={c.id}
                onClick={() => navigate(`/publico/${c.id}`)}
                className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-gray-100 hover:border-blue-500 hover:shadow-blue-50 transition-all flex flex-col gap-6 group text-left"
              >
                <div className="bg-gray-50 w-14 h-14 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Building2 size={28} />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-xl leading-tight">{c.nome}</p>
                  <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">{c.cidade} - {c.estado}</p>
                </div>
              </button>
            )) : (
              <div className="col-span-full py-20 bg-white rounded-[3rem] border-4 border-dashed border-gray-100 text-center">
                <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-xl">Nenhuma Câmara Encontrada</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!autenticacaoPronta) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <header className="bg-blue-900 text-white p-8 shadow-2xl z-10 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/publico')} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Sessão Plenária</h1>
            <p className="text-blue-300 font-bold text-sm uppercase tracking-widest mt-1">Câmara Municipal em Tempo Real</p>
          </div>
        </div>
        <div className="text-right flex items-center gap-8">
          <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/10">
            <IndicadorQuorum presentes={quorum.presentes} total={quorum.total} label="Parlamentares" />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em]">Data e Hora</p>
            <p className="text-xl font-bold">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gray-50 p-12 overflow-hidden flex flex-col gap-12">
        <div className="flex items-center justify-between">
          <span className="px-6 py-2 bg-blue-100 text-blue-700 rounded-full text-lg font-black uppercase tracking-widest border border-blue-200">
            {faseAtual?.nome_fase || 'Aguardando Início'}
          </span>
          <p className="text-gray-400 font-bold uppercase text-sm tracking-widest">SGLM PRO • Transparência Total</p>
        </div>

        {itemAtual ? (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-8 space-y-8">
              <ItemPautaDestaque item={itemAtual} />
            </div>

            <div className="lg:col-span-4 space-y-8">
              {state.votacaoAtiva && state.resultadoVotacao ? (
                <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 space-y-8">
                  <h3 className="text-xl font-black text-gray-900 border-b border-gray-100 pb-4 uppercase tracking-tighter text-center">Apuração Nominal</h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-6 bg-green-50 rounded-2xl border border-green-100">
                      <span className="text-2xl font-black text-green-700">SIM</span>
                      <span className="text-5xl font-black text-green-700">{state.resultadoVotacao.sim}</span>
                    </div>
                    <div className="flex justify-between items-center p-6 bg-red-50 rounded-2xl border border-red-100">
                      <span className="text-2xl font-black text-red-700">NÃO</span>
                      <span className="text-5xl font-black text-red-700">{state.resultadoVotacao.nao}</span>
                    </div>
                    <div className="flex justify-between items-center p-6 bg-amber-50 rounded-2xl border border-amber-100">
                      <span className="text-xl font-black text-amber-700">ABSTER</span>
                      <span className="text-4xl font-black text-amber-700">{state.resultadoVotacao.abstencoes}</span>
                    </div>
                  </div>
                  <div className={cn("p-6 rounded-2xl text-center font-black text-2xl shadow-lg transition-all", state.resultadoVotacao.aprovado ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500")}>
                    {state.resultadoVotacao.aprovado ? 'MATÉRIA APROVADA' : 'MATÉRIA REJEITADA'}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-gray-100 text-center space-y-6 h-full flex flex-col justify-center">
                  <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Monitor size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Em Discussão</h3>
                  <p className="text-gray-500 font-medium">Aguardando abertura do processo de votação nominal.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border-8 border-dashed border-gray-200 rounded-[5rem] bg-white/50 space-y-6">
            <Monitor size={120} className="text-gray-200" />
            <p className="text-5xl font-black text-gray-300 uppercase tracking-[0.2em]">Aguardando Ordem do Dia</p>
          </div>
        )}
      </main>

      <footer className="p-8 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
        <div>Portal da Transparência Legislativa Municipal</div>
        <div>Desenvolvido por SGLM PRO © 2026</div>
      </footer>
    </div>
  );
};
