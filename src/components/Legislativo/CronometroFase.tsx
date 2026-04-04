import React from 'react';
import { Clock } from 'lucide-react';
import { formatTime } from '../../lib/utils';

interface CronometroFaseProps {
  segundos: number;
  label?: string;
}

/**
 * Componente que exibe o tempo restante da fase atual com ícone e formatação.
 */
export const CronometroFase: React.FC<CronometroFaseProps> = ({ 
  segundos, 
  label = "Tempo na Fase" 
}) => {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
        <Clock size={20} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-lg font-black text-gray-900 tabular-nums">
          {formatTime(segundos)}
        </p>
      </div>
    </div>
  );
};
