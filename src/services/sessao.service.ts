import { supabase } from '../lib/supabase';
import { SessaoDTO, ConfiguracaoFaseDTO, PresencaDTO } from '../dtos/sessao.dto';

/**
 * Serviço responsável pela gestão de sessões legislativas, ritos e presença.
 */
export const sessaoService = {
  async buscarSessaoAtiva(camaraId: string): Promise<SessaoDTO | null> {
    const { data } = await supabase
      .from('sessoes')
      .select('*')
      .eq('camara_id', camaraId)
      .eq('status', 'EM_CURSO')
      .order('data_inicio', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  },

  async listarSessoesAgendadas(camaraId: string): Promise<SessaoDTO[]> {
    const { data } = await supabase
      .from('sessoes')
      .select('*')
      .eq('camara_id', camaraId)
      .eq('status', 'AGUARDANDO')
      .order('data_inicio', { ascending: true });
    return data || [];
  },

  async buscarFases(templateId: string): Promise<ConfiguracaoFaseDTO[]> {
    const { data } = await supabase
      .from('configuracao_fases')
      .select('*')
      .eq('template_id', templateId)
      .order('ordem');
    return data || [];
  },

  async buscarItensPauta(sessaoId: string): Promise<any[]> {
    const { data } = await supabase
      .from('itens_pauta')
      .select('*')
      .eq('sessao_id', sessaoId)
      .order('ordem');
    return data || [];
  },

  async buscarPresencas(sessaoId: string): Promise<PresencaDTO[]> {
    const { data } = await supabase
      .from('presencas')
      .select('*')
      .eq('sessao_id', sessaoId);
    return data || [];
  },

  async registrarPresenca(sessaoId: string, usuarioId: string) {
    return await supabase.from('presencas').upsert({
      sessao_id: sessaoId,
      usuario_id: usuarioId,
      timestamp: new Date().toISOString()
    });
  },

  async criarSessao(dados: { camara_id: string, template_id: string, data_inicio: string }) {
    return await supabase.from('sessoes').insert({
      ...dados,
      status: 'AGUARDANDO'
    });
  },

  async abrirSessao(sessaoId: string) {
    return await supabase
      .from('sessoes')
      .update({ status: 'EM_CURSO', fase_indice_atual: 0 })
      .eq('id', sessaoId);
  },

  async avancarFase(sessaoId: string, novoIndice: number) {
    return await supabase
      .from('sessoes')
      .update({ fase_indice_atual: novoIndice })
      .eq('id', sessaoId);
  },

  async finalizarSessao(sessaoId: string) {
    return await supabase
      .from('sessoes')
      .update({ status: 'FINALIZADA' })
      .eq('id', sessaoId);
  }
};
