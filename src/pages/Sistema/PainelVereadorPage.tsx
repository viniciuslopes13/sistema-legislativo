import React, { useState } from 'react';
import { CheckCircle2, Clock, FileText, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

// Importação dos Componentes Reutilizáveis
import { CronometroFase } from '../../components/Legislativo/CronometroFase';
import { IndicadorQuorum } from '../../components/Legislativo/IndicadorQuorum';
import { ItemPautaDestaque } from '../../components/Legislativo/ItemPautaDestaque';
import { CardVotacao } from '../../components/Legislativo/CardVotacao';

import { useAuthContext } from '../../context/AuthContext';
import { useSessaoAtivaContext } from '../../context/SessaoAtivaContext';

/**
 * Painel Principal do Vereador (Tema Claro).
 */
export const PainelVereadorPage = () => {
  const auth = useAuthContext();
  const sessaoCtx = useSessaoAtivaContext();
  const state = { ...auth, ...sessaoCtx };
  const [hasVoted, setHasVoted] = useState(false);
  const [lastVote, setLastVote] = useState<string | null>(null);

  const handleVote = async (option: 'SIM' | 'NAO' | 'ABSTER') => {
    if (!state.usuarioAtual?.temPermissao('VOTAR')) {
      alert('Você não tem permissão para votar.');
      return;
    }
    await state.registrarVoto(option);
    setHasVoted(true);
    setLastVote(option);
  };

  const currentItem = state.itens?.[0];

  if (!currentItem) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <FileText size={48} className="mx-auto text-gray-300" />
          <p className="text-gray-500 font-bold">Aguardando pauta da sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-y-auto min-h-full">
      <div className="max-w-5xl mx-auto space-y-8 pb-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <Clock size={16} />
          <span>Sessão Plenária Ordinária</span>
          <ChevronRight size={14} />
          <span className="text-blue-600 font-bold">{state.faseAtual?.nome_fase || 'Sessão'}</span>
        </div>

        {/* Item da Pauta em Destaque */}
        <ItemPautaDestaque item={currentItem} />

        {/* Seção de Votação */}
        {state.votacaoAtiva ? (
          <div className="space-y-8">
            <CardVotacao 
              onVotar={handleVote} 
              foiVotado={hasVoted} 
              ultimoVoto={lastVote} 
            />
            
            {state.resultadoVotacao && state.usuarioAtual?.temPermissao('SESSAO_AVANCAR') && (
              <div className="mt-8 p-6 bg-white rounded-2xl border border-blue-100 text-center shadow-sm">
                <p className="text-sm font-bold text-blue-800">Progresso da Votação</p>
                <div className="flex justify-center gap-8 mt-2">
                  <span className="text-green-600 font-black">SIM: {state.resultadoVotacao.sim}</span>
                  <span className="text-red-600 font-black">NÃO: {state.resultadoVotacao.nao}</span>
                  <span className="text-amber-600 font-black">ABSTER: {state.resultadoVotacao.abstencoes}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-blue-100 rounded-[2rem] p-12 text-center space-y-4 shadow-sm">
             <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600 animate-pulse">
                <Clock size={32} />
             </div>
             <h3 className="text-2xl font-black text-blue-900">Aguardando Abertura de Votação</h3>
             <p className="text-blue-600 font-medium">O secretário ou presidente deve iniciar a votação deste item.</p>
          </div>
        )}
      </div>

      {/* Barra Inferior de Status (Tema Claro) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 px-8 py-4 flex items-center justify-between z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-12">
          <CronometroFase segundos={state.tempoRestante} />
          <IndicadorQuorum presentes={state.quorum.presentes} total={state.quorum.total} />
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => state.registrarPresenca()} 
            className="px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-black hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center gap-2"
          >
            <CheckCircle2 size={18} />
            Confirmar Presença
          </button>
          <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 border border-gray-200">
            <FileText size={18} />
            Texto Integral
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Voto (Ajustado para Tema Claro) */}
      <AnimatePresence>
        {hasVoted && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm">
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
                  "font-black px-3 py-1 rounded-lg",
                  lastVote === 'SIM' && "bg-green-100 text-green-700",
                  lastVote === 'NAO' && "bg-red-100 text-red-700",
                  lastVote === 'ABSTER' && "bg-amber-100 text-amber-700"
                )}>{lastVote}</span> foi registrado com sucesso.
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
