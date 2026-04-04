import React from 'react';
import { Users } from 'lucide-react';

interface IndicadorQuorumProps {
  presentes: number;
  total: number;
  label?: string;
}

/**
 * Componente que exibe o status de presença (Quórum) da sessão.
 */
export const IndicadorQuorum: React.FC<IndicadorQuorumProps> = ({ 
  presentes, 
  total, 
  label = "Presença" 
}) => {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
        <Users size={20} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-lg font-black text-gray-900">{presentes}/{total} Presentes</p>
      </div>
    </div>
  );
};
