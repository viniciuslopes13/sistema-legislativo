import { supabase } from '../lib/supabase';

export interface Perfil {
  id: string;
  nome: string;
  tipo_base: 'PRESIDENTE' | 'SECRETARIO' | 'VEREADOR' | 'ADMIN';
  camara_id: string | null;
  operacoes_ids: string[];
}

export interface Operacao {
  id: string;
  codigo: string;
  descricao: string;
}

export const rbacService = {
  async listarOperacoes(): Promise<Operacao[]> {
    const { data, error } = await supabase.from('operacoes').select('*').order('codigo');
    if (error) throw error;
    return data || [];
  },

  async listarPerfis(camaraId?: string): Promise<Perfil[]> {
    let query = supabase.from('perfis').select(`
      *,
      perfil_operacoes(operacao_id)
    `).order('nome');

    if (camaraId) {
      query = query.or(`camara_id.is.null,camara_id.eq.${camaraId}`);
    } else {
      query = query.is('camara_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((p: any) => ({
      id: p.id,
      nome: p.nome,
      tipo_base: p.tipo_base,
      camara_id: p.camara_id,
      operacoes_ids: p.perfil_operacoes?.map((po: any) => po.operacao_id) || []
    }));
  },

  async criarPerfil(dados: Omit<Perfil, 'id'>) {
    const { data, error } = await supabase.from('perfis').insert({
      nome: dados.nome,
      tipo_base: dados.tipo_base,
      camara_id: dados.camara_id
    }).select('id').single();

    if (error) throw error;

    if (dados.operacoes_ids.length > 0) {
      const mapeamento = dados.operacoes_ids.map(oid => ({
        perfil_id: data.id,
        operacao_id: oid
      }));
      const { error: poError } = await supabase.from('perfil_operacoes').insert(mapeamento);
      if (poError) throw poError;
    }
  },

  async atualizarPerfil(id: string, dados: Omit<Perfil, 'id'>) {
    const { error: updError } = await supabase.from('perfis').update({
      nome: dados.nome,
      tipo_base: dados.tipo_base
    }).eq('id', id);

    if (updError) throw updError;

    // Remove velhas
    await supabase.from('perfil_operacoes').delete().eq('perfil_id', id);

    // Insere novas
    if (dados.operacoes_ids.length > 0) {
      const mapeamento = dados.operacoes_ids.map(oid => ({
        perfil_id: id,
        operacao_id: oid
      }));
      const { error: poError } = await supabase.from('perfil_operacoes').insert(mapeamento);
      if (poError) throw poError;
    }
  },

  async excluirPerfil(id: string) {
    const { error } = await supabase.from('perfis').delete().eq('id', id);
    if (error) throw error;
  }
};
