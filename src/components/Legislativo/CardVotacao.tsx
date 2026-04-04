import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CardVotacaoProps {
  onVotar: (opcao: 'SIM' | 'NAO' | 'ABSTER') => void;
  foiVotado: boolean;
  ultimoVoto: string | null;
}

/**
 * Componente que exibe as opções de voto para o parlamentar.
 */
export const CardVotacao: React.FC<CardVotacaoProps> = ({ 
  onVotar, 
  foiVotado, 
  ultimoVoto 
}) => {
  const opcoes = [
    { id: 'SIM', label: 'SIM', sub: 'FAVORÁVEL À PROPOSTA', icon: CheckCircle2, color: 'green' },
    { id: 'NAO', label: 'NÃO', sub: 'CONTRÁRIO À PROPOSTA', icon: XCircle, color: 'red' },
    { id: 'ABSTER', label: 'ABSTER', sub: 'ABSTENÇÃO DE VOTO', icon: MinusCircle, color: 'amber' },
  ];

  return (
    <div className="text-center space-y-8 py-8">
      <div className="relative inline-block">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-2">
          Selecione seu voto abaixo
        </h3>
        <div className="h-1 w-12 bg-blue-600 mx-auto rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {opcoes.map((opt) => (
          <motion.button
            key={opt.id}
            whileHover={!foiVotado ? { y: -8, scale: 1.02 } : {}}
            whileTap={!foiVotado ? { scale: 0.98 } : {}}
            disabled={foiVotado}
            onClick={() => onVotar(opt.id as any)}
            className={cn(
              "relative group bg-white p-10 rounded-[2.5rem] shadow-xl transition-all border-b-8 flex flex-col items-center gap-6",
              foiVotado && ultimoVoto !== opt.id && "opacity-40 grayscale",
              foiVotado && ultimoVoto === opt.id && "ring-4 ring-offset-4",
              opt.color === 'green' && (foiVotado && ultimoVoto === opt.id ? "border-green-500 ring-green-500" : "border-green-500 hover:shadow-green-100"),
              opt.color === 'red' && (foiVotado && ultimoVoto === opt.id ? "border-red-500 ring-red-500" : "border-red-500 hover:shadow-red-100"),
              opt.color === 'amber' && (foiVotado && ultimoVoto === opt.id ? "border-amber-500 ring-amber-500" : "border-amber-500 hover:shadow-amber-100")
            )}
          >
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
              opt.color === 'green' && "bg-green-50 text-[#22C55E]",
              opt.color === 'red' && "bg-red-50 text-[#EF4444]",
              opt.color === 'amber' && "bg-amber-50 text-[#EAB308]"
            )}>
              <opt.icon size={40} strokeWidth={3} />
            </div>
            <div className="text-center">
              <span className={cn(
                "text-4xl font-black block mb-1",
                opt.color === 'green' && "text-[#22C55E]",
                opt.color === 'red' && "text-[#EF4444]",
                opt.color === 'amber' && "text-[#EAB308]"
              )}>{opt.label}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{opt.sub}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
