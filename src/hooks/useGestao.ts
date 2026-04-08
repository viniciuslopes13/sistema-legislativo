import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Sessao } from '../models/Sessao.model';
import { Usuario } from '../models/Usuario.model';
import { CamaraDTO } from '../dtos/camara.dto';
import { camaraService } from '../services/camara.service';
import { usuarioService } from '../services/usuario.service';
import { sessaoService } from '../services/sessao.service';
import { rbacService, Perfil, Operacao } from '../services/rbac.service';
import { useAuthContext } from '../context/AuthContext';

export function useGestao(idCamaraOverride?: string) {
  const { usuarioAtual, autenticacaoPronta } = useAuthContext();
  const [channelId] = useState(() => Math.random().toString(36).substring(7));
  
  const [sessoesAgendadas, setSessoesAgendadas] = useState<Sessao[]>([]);
  const [parlamentares, setParlamentares] = useState<Usuario[]>([]);
  const [camaras, setCamaras] = useState<CamaraDTO[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);

  const buscarCamaras = useCallback(async () => {
    const dados = await camaraService.listarCamaras();
    setCamaras(dados);
  }, []);

  const buscarTemplates = useCallback(async () => {
    const idCamara = idCamaraOverride || usuarioAtual?.camara_id;
    if (!idCamara) return;
    const dados = await camaraService.buscarTemplates(idCamara);
    setTemplates(dados);
  }, [usuarioAtual?.camara_id, idCamaraOverride]);

  const buscarPerfisRb = useCallback(async () => {
    const idCamara = idCamaraOverride || usuarioAtual?.camara_id;
    const isGlobAdm = usuarioAtual?.temPermissao('SISTEMA_ADMINISTRAR_TENANTS');
    if (!idCamara && !isGlobAdm) return;
    
    try {
      const ops = await rbacService.listarOperacoes();
      setOperacoes(ops);
      const perfData = await rbacService.listarPerfis(isGlobAdm ? undefined : idCamara);
      setPerfis(perfData);
    } catch (e) {
      console.error("Erro RBAC:", e);
    }
  }, [usuarioAtual, idCamaraOverride]);

  const buscarParlamentares = useCallback(async () => {
    const idCamara = idCamaraOverride || usuarioAtual?.camara_id;
    if (!idCamara && !usuarioAtual?.temPermissao('SISTEMA_ADMINISTRAR_TENANTS')) return;
    
    try {
      const dtos = await usuarioService.listarParlamentares(idCamara);
      setParlamentares(dtos.map(dto => Usuario.deDTO(dto)));
    } catch (e) {
      console.error("Erro ao buscar parlamentares:", e);
    }
  }, [usuarioAtual, idCamaraOverride]);

  const buscarSessoesAgendadas = useCallback(async () => {
    const idCamara = idCamaraOverride || usuarioAtual?.camara_id;
    if (!idCamara) return;
    try {
      const agendadasDto = await sessaoService.listarSessoesAgendadas(idCamara);
      setSessoesAgendadas(Sessao.listaDeDTO(agendadasDto));
    } catch (e) {
      console.error("Erro ao buscar sessoes agendadas:", e);
    }
  }, [usuarioAtual?.camara_id, idCamaraOverride]);

  // Engine: Realtime para os dados base e de gestão
  useEffect(() => {
    if (!autenticacaoPronta) return;
    const idCamara = idCamaraOverride || usuarioAtual?.camara_id;

    buscarCamaras();
    buscarTemplates();
    buscarPerfisRb();
    buscarParlamentares();
    buscarSessoesAgendadas();

    const canal = supabase.channel(`gestao_${idCamara || 'global'}_${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, buscarParlamentares)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parlamentares' }, buscarParlamentares)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuario_perfis' }, buscarParlamentares)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camaras' }, buscarCamaras)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessoes' }, buscarSessoesAgendadas)
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, [autenticacaoPronta, usuarioAtual?.camara_id, idCamaraOverride, buscarCamaras, buscarTemplates, buscarParlamentares, buscarSessoesAgendadas, channelId]);

  // Actions da Gestão

  const criarSessao = async (dados: any) => {
    if (!usuarioAtual?.temPermissao('SESSAO_AGENDAR')) throw new Error('Sem permissão.');
    const idCamara = usuarioAtual?.temPermissao('SISTEMA_ADMINISTRAR_TENANTS') ? dados.camara_id : usuarioAtual?.camara_id;
    const { error } = await sessaoService.criarSessao({ camara_id: idCamara, template_id: dados.template_id, data_inicio: dados.data_inicio });
    if (error) throw error;
    buscarSessoesAgendadas();
  };

  const criarCamara = async (dados: Partial<CamaraDTO>) => {
    if (!usuarioAtual?.temPermissao('SISTEMA_ADMINISTRAR_TENANTS')) throw new Error('Sem permissão.');
    const { error } = await camaraService.criarCamara(dados);
    if (error) throw error;
    buscarCamaras();
  };

  const criarUsuario = async (dados: any, perfisIds: string[]) => {
    const idCamara = usuarioAtual?.temPermissao('SISTEMA_ADMINISTRAR_TENANTS') ? dados.camara_id : usuarioAtual?.camara_id;
    const resultado = await usuarioService.criarUsuario(dados, perfisIds, idCamara);
    buscarParlamentares();
    return resultado;
  };

  const atualizarCamara = async (id: string, dados: Partial<CamaraDTO>) => {
    await camaraService.atualizarCamara(id, dados);
    buscarCamaras();
  };

  const atualizarUsuario = async (id: string, dados: any) => {
    await usuarioService.atualizarUsuario(id, dados);
    buscarParlamentares();
  };

  const resetarSenhaUsuario = async (id: string) => {
    const novaSenha = await usuarioService.resetarSenha(id);
    buscarParlamentares();
    return novaSenha;
  };

  return {
    sessoesAgendadas,
    parlamentares,
    camaras,
    templates,
    perfis,
    operacoes,
    criarSessao,
    criarCamara,
    criarUsuario,
    atualizarCamara,
    atualizarUsuario,
    resetarSenhaUsuario,
    criarPerfil: async (dados: Omit<Perfil, 'id'>) => {
      await rbacService.criarPerfil(dados);
      await buscarPerfisRb();
    },
    atualizarPerfil: async (id: string, dados: Omit<Perfil, 'id'>) => {
      await rbacService.atualizarPerfil(id, dados);
      await buscarPerfisRb();
    },
    excluirPerfil: async (id: string) => {
      await rbacService.excluirPerfil(id);
      await buscarPerfisRb();
    }
  };
}
