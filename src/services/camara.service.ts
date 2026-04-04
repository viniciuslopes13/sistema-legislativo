import { supabase } from '../lib/supabase';
import { CamaraDTO } from '../dtos/camara.dto';

/**
 * Serviço responsável pela gestão das Câmaras Municipais.
 */
export const camaraService = {
  async listarCamaras(): Promise<CamaraDTO[]> {
    const { data } = await supabase
      .from('camaras')
      .select('*')
      .eq('ativo', true)
      .order('nome');
    return data || [];
  },

  async buscarTemplates(camaraId: string): Promise<any[]> {
    const { data } = await supabase
      .from('templates_rito')
      .select('*')
      .eq('camara_id', camaraId);
    return data || [];
  },

  async criarCamara(dados: Partial<CamaraDTO>) {
    return await supabase
      .from('camaras')
      .insert({ ...dados, ativo: true });
  },

  async atualizarCamara(id: string, dados: Partial<CamaraDTO>) {
    return await supabase
      .from('camaras')
      .update(dados)
      .eq('id', id);
  },

  /**
   * Exclui uma Câmara Municipal do sistema.
   * Verifica se existem usuários associados antes de permitir a exclusão.
   */
  async excluirCamara(id: string) {
    // 1. Verificar se existem usuários vinculados a esta câmara
    const { count: totalUsuarios, error: countError } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('camara_id', id);

    if (countError) throw countError;

    if (totalUsuarios && totalUsuarios > 0) {
      throw new Error(`Não é possível excluir esta Câmara pois existem ${totalUsuarios} usuários/parlamentares vinculados a ela. Remova os usuários primeiro.`);
    }

    // 2. Tentar excluir a câmara
    const { error, count: totalExcluidos } = await supabase
      .from('camaras')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new Error('Não é possível excluir esta Câmara pois ela possui registros históricos (sessões ou votações) vinculados.');
      }
      throw error;
    }

    if (totalExcluidos === 0) {
      throw new Error('A câmara não pôde ser excluída. Verifique se você tem permissões de Administrador Global no banco de dados.');
    }
  }
};
