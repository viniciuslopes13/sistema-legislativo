import { supabase } from '../lib/supabase';
import { VotacaoDTO, VotoDTO } from '../dtos/votacao.dto';

/**
 * Serviço responsável por gerenciar votações e votos parlamentares.
 */
export const votacaoService = {
  async buscarVotacaoAtiva(): Promise<VotacaoDTO | null> {
    const { data } = await supabase
      .from('votacoes')
      .select('*')
      .in('status', ['VOTANDO', 'DISCUSSAO'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  },

  async buscarVotos(votacaoId: string): Promise<VotoDTO[]> {
    const { data } = await supabase
      .from('votos')
      .select('*')
      .eq('votacao_id', votacaoId);
    return data || [];
  },

  async abrirVotacao(itemId: string) {
    const { data, error } = await supabase
      .from('votacoes')
      .insert({
        item_id: itemId,
        status: 'VOTANDO',
        hora_inicio: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async registrarVoto(votacaoId: string, usuarioId: string, opcao: 'SIM' | 'NAO' | 'ABSTER') {
    return await supabase.from('votos').upsert({
      votacao_id: votacaoId,
      usuario_id: usuarioId,
      opcao,
      timestamp: new Date().toISOString()
    });
  },

  async encerrarVotacao(votacaoId: string) {
    return await supabase
      .from('votacoes')
      .update({ status: 'FINALIZADA', hora_fim: new Date().toISOString() })
      .eq('id', votacaoId);
  }
};
