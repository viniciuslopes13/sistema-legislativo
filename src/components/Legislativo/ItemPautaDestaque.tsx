import React from 'react';
import { FileText } from 'lucide-react';
import { ItemPautaDTO } from '../../dtos/votacao.dto';

interface ItemPautaDestaqueProps {
  item: ItemPautaDTO;
}

/**
 * Exibe o item da pauta principal em destaque (Grande Card).
 */
export const ItemPautaDestaque: React.FC<ItemPautaDestaqueProps> = ({ item }) => {
  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100 flex flex-col md:flex-row min-h-[400px]">
      <div className="md:w-2/5 bg-blue-600 relative p-8 flex items-center justify-center overflow-hidden">
        <div className="absolute top-6 left-6 bg-blue-900 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest z-10">
          {item.tipo_materia}
        </div>
        <div className="relative z-10 w-48 h-48 bg-white/20 backdrop-blur-xl rounded-full border border-white/30 flex items-center justify-center">
           <FileText size={80} className="text-white" />
        </div>
      </div>
      
      <div className="md:w-3/5 p-10 flex flex-col justify-center">
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Item da Pauta</span>
          <span className="text-xs font-mono text-gray-400">ORDEM: {item.ordem}</span>
        </div>
        <h2 className="text-4xl font-black text-gray-900 leading-[1.1] mb-6">
          {item.titulo_manual}
        </h2>
        <div className="space-y-2">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ementa</h4>
          <p className="text-gray-600 leading-relaxed text-lg">
            {item.ementa_manual}
          </p>
        </div>
      </div>
    </div>
  );
};
