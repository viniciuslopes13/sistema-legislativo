import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ParlamentarDTO } from '../dtos/usuario.dto';

const supabaseAdminTemp = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  { auth: { persistSession: false } }
);

export const usuarioService = {
  /**
   * Busca o perfil detalhado. Se falhar, retorna o básico do auth para não travar o app.
   */
  async buscarPerfilPorId(userId: string): Promise<ParlamentarDTO | null> {
    console.log(`[SGLM] Iniciando busca de perfil para: ${userId}`);
    
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from('usuarios')
        .select(`
          *,
          parlamentares(*),
          usuario_perfis(
            perfis(
              tipo_base,
              perfil_operacoes(
                operacoes(codigo)
              )
            )
          )
        `)
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error("[SGLM] Erro RLS ou Banco ao buscar perfil:", profileError);
        // Fallback: Tenta buscar pelo menos o registro básico na tabela usuarios
        const { data: basic } = await supabase.from('usuarios').select('*').eq('id', userId).maybeSingle();
        if (basic) return { ...basic, perfil: 'VEREADOR', permissoes: [] } as any;
        return null;
      }

      if (!userProfile) {
        console.warn("[SGLM] Usuário não encontrado na tabela 'usuarios'. Verifique se o ID existe.");
        return null;
      }

      const permissoes = new Set<string>();
      let bestTipoBase: any = 'VEREADOR';
      const prioridade: Record<string, number> = { 'ADMIN': 4, 'PRESIDENTE': 3, 'SECRETARIO': 2, 'VEREADOR': 1 };
      
      const uPerfis = userProfile.usuario_perfis;
      if (uPerfis && Array.isArray(uPerfis)) {
        uPerfis.forEach((up: any) => {
          const p = up.perfis;
          if (p) {
            if ((prioridade[p.tipo_base] || 0) > (prioridade[bestTipoBase] || 0)) bestTipoBase = p.tipo_base;
            p.perfil_operacoes?.forEach((po: any) => {
              if (po.operacoes?.codigo) permissoes.add(po.operacoes.codigo);
            });
          }
        });
      }

      console.log(`[SGLM] Perfil carregado com sucesso. Tipo: ${bestTipoBase}`);

      return {
        ...userProfile,
        partido: userProfile.parlamentares?.partido || '',
        cargo_mesa: userProfile.parlamentares?.cargo_mesa,
        foto_url: userProfile.parlamentares?.foto_url,
        is_suplente: userProfile.parlamentares?.is_suplente || false,
        em_exercicio: userProfile.parlamentares?.em_exercicio || true,
        perfil: bestTipoBase,
        permissoes: Array.from(permissoes)
      };
    } catch (err) {
      console.error("[SGLM] Erro inesperado no usuarioService:", err);
      return null;
    }
  },

  async listarParlamentares(camaraId?: string): Promise<ParlamentarDTO[]> {
    let query = supabase.from('usuarios').select(`
      *,
      parlamentares(*),
      usuario_perfis(
        perfis(tipo_base)
      )
    `);

    if (camaraId) query = query.eq('camara_id', camaraId);
    
    const { data } = await query.order('nome');
    if (!data) return [];

    return data.map(p => {
      const perfisList = p.usuario_perfis?.map((up: any) => up.perfis?.tipo_base).filter(Boolean) || [];
      const bestPerfil = perfisList.includes('ADMIN') ? 'ADMIN' : 
                         perfisList.includes('PRESIDENTE') ? 'PRESIDENTE' :
                         perfisList.includes('SECRETARIO') ? 'SECRETARIO' : 
                         perfisList[0] || 'VEREADOR';

      return {
        ...p,
        partido: p.parlamentares?.partido || '',
        cargo_mesa: p.parlamentares?.cargo_mesa,
        foto_url: p.parlamentares?.foto_url,
        is_suplente: p.parlamentares?.is_suplente || false,
        em_exercicio: p.parlamentares?.em_exercicio || true,
        perfil: bestPerfil
      };
    });
  },

  async criarUsuario(dados: any, perfilTipo: string, camaraId: string) {
    const senhaProvisoria = Math.floor(100000 + Math.random() * 900000).toString();
    const { data: authData, error: authError } = await supabaseAdminTemp.auth.signUp({
      email: dados.email, password: senhaProvisoria, options: { data: { nome: dados.nome } }
    });

    if (authError || !authData.user) throw authError || new Error('Auth fail');

    const novoId = authData.user.id;
    await supabase.from('usuarios').insert({
      id: novoId, nome: dados.nome, email: dados.email, whatsapp: dados.whatsapp, 
      camara_id: camaraId || null, ativo: false, senha_provisoria: senhaProvisoria, senha_alterada: false
    });

    let perfilId = null;
    // Se for admin, busca perfil global, senão busca perfil da câmara
    const query = supabase.from('perfis').select('id').eq('tipo_base', perfilTipo);
    if (perfilTipo === 'ADMIN') {
      query.is('camara_id', null);
    } else {
      query.eq('camara_id', camaraId);
    }
    
    const { data: lp } = await query.maybeSingle();
    if (lp) perfilId = lp.id;

    if (perfilId) await supabase.from('usuario_perfis').insert({ usuario_id: novoId, perfil_id: perfilId });
    if (['VEREADOR', 'PRESIDENTE'].includes(perfilTipo)) await supabase.from('parlamentares').insert({ id: novoId, partido: dados.partido || 'SGLM' });

    return { senhaProvisoria };
  },

  async atualizarUsuario(usuarioId: string, dados: any) {
    await supabase.from('usuarios').update({ nome: dados.nome, email: dados.email, whatsapp: dados.whatsapp, ativo: dados.ativo }).eq('id', usuarioId);
    const { data: isParl } = await supabase.from('parlamentares').select('id').eq('id', usuarioId).maybeSingle();
    if (isParl) await supabase.from('parlamentares').update({ partido: dados.partido, cargo_mesa: dados.cargo_mesa, is_suplente: dados.is_suplente, em_exercicio: dados.em_exercicio }).eq('id', usuarioId);
  },

  async resetarSenha(usuarioId: string) {
    const novaSenha = Math.floor(100000 + Math.random() * 900000).toString();
    await supabase.from('usuarios').update({ senha_provisoria: novaSenha, senha_alterada: false, ativo: false }).eq('id', usuarioId);
    return novaSenha;
  },

  /**
   * Exclui um usuário permanentemente do sistema.
   * O banco de dados está configurado com ON DELETE CASCADE em parlamentares e perfis,
   * mas trataremos erros de restrição referencial (ex: se ele for autor de uma lei/sessão).
   */
  async excluirUsuario(usuarioId: string) {
    // Tentamos excluir primeiro do Supabase Auth (via Edge Function ou Client Admin se disponível)
    // No contexto atual, excluiremos da tabela pública 'usuarios'.
    // Devido às Foreign Keys, se houver dependências não-cascade, o banco retornará erro.
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', usuarioId);

    if (error) {
      if (error.code === '23503') {
        throw new Error('Não é possível excluir este usuário pois ele possui registros vinculados (votos, sessões ou proposições) que impedem a remoção por segurança histórica.');
      }
      throw error;
    }
  }
};
