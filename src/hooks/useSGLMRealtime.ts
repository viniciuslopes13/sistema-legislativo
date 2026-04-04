import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Importação dos DTOs (Data Transfer Objects)
import { SessaoDTO, ConfiguracaoFaseDTO, PresencaDTO } from '../dtos/sessao.dto';
import { VotacaoDTO, VotoDTO, ItemPautaDTO } from '../dtos/votacao.dto';
import { ParlamentarDTO } from '../dtos/usuario.dto';
import { CamaraDTO } from '../dtos/camara.dto';

// Importação dos modelos orientados a objetos
import { Sessao } from '../models/Sessao.model';
import { Votacao } from '../models/Votacao.model';
import { Usuario } from '../models/Usuario.model';

// Importação dos serviços
import { autenticacaoService } from '../services/autenticacao.service';
import { usuarioService } from '../services/usuario.service';
import { sessaoService } from '../services/sessao.service';
import { votacaoService } from '../services/votacao.service';
import { camaraService } from '../services/camara.service';

/**
 * Hook central que gerencia o estado da aplicação em tempo real.
 */
export function useSGLMRealtime(idCamaraOverride?: string) {
  // Estados de Dados
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [sessoesAgendadas, setSessoesAgendadas] = useState<Sessao[]>([]);
  const [fases, setFases] = useState<ConfiguracaoFaseDTO[]>([]);
  const [itens, setItens] = useState<ItemPautaDTO[]>([]);
  const [votacaoAtiva, setVotacaoAtiva] = useState<Votacao | null>(null);
  const [votos, setVotos] = useState<VotoDTO[]>([]);
  const [presencas, setPresencas] = useState<PresencaDTO[]>([]);
  const [parlamentares, setParlamentares] = useState<Usuario[]>([]);
  const [camaras, setCamaras] = useState<CamaraDTO[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  
  // Estados de Sessão do Usuário
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [autenticacaoPronta, setAutenticacaoPronta] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(0);
  
  const refIdUsuarioAtual = useRef<string | null>(null);

  // --- Fetchers ---

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

  const buscarParlamentares = useCallback(async () => {
    const idCamara = idCamaraOverride || usuarioAtual?.camara_id;
    if (!idCamara && !usuarioAtual?.eAdminGlobal()) return;
    
    try {
      const dtos = await usuarioService.listarParlamentares(idCamara);
      setParlamentares(dtos.map(dto => Usuario.deDTO(dto)));
    } catch (e) {
      console.error("Erro ao buscar parlamentares:", e);
    }
  }, [usuarioAtual, idCamaraOverride]);

  const buscarDadosSessao = useCallback(async () => {
    const idCamara = idCamaraOverride || usuarioAtual?.camara_id;
    if (!idCamara) return;
    
    try {
      const sessaoDto = await sessaoService.buscarSessaoAtiva(idCamara);

      if (sessaoDto) {
        setSessao(Sessao.deDTO(sessaoDto));
        if (sessaoDto.template_id) {
          const dadosFases = await sessaoService.buscarFases(sessaoDto.template_id);
          setFases(dadosFases);
        }
        const dadosItens = await sessaoService.buscarItensPauta(sessaoDto.id);
        setItens(dadosItens);

        const votacaoDto = await votacaoService.buscarVotacaoAtiva();
        if (votacaoDto) {
          setVotacaoAtiva(Votacao.deDTO(votacaoDto));
          const dadosVotos = await votacaoService.buscarVotos(votacaoDto.id);
          setVotos(dadosVotos);
        } else {
          setVotacaoAtiva(null);
          setVotos([]);
        }
        const dadosPresencas = await sessaoService.buscarPresencas(sessaoDto.id);
        setPresencas(dadosPresencas);
      } else {
        setSessao(null);
        setFases([]);
        setItens([]);
        setVotacaoAtiva(null);
        setVotos([]);
      }

      const agendadasDto = await sessaoService.listarSessoesAgendadas(idCamara);
      setSessoesAgendadas(Sessao.listaDeDTO(agendadasDto));
    } catch (e) {
      console.error("Erro ao buscar dados da sessão:", e);
    }
  }, [usuarioAtual?.camara_id, idCamaraOverride]);

  const buscarPerfil = useCallback(async (idUsuario: string) => {
    try {
      const dto = await usuarioService.buscarPerfilPorId(idUsuario);
      if (dto) setUsuarioAtual(Usuario.deDTO(dto));
    } catch (err) {
      console.error("Erro crítico ao carregar perfil:", err);
    } finally {
      setAutenticacaoPronta(true);
    }
  }, []);

  // --- Realtime Engine ---
  useEffect(() => {
    autenticacaoService.obterSessaoAtual().then(session => {
      if (session?.user) {
        refIdUsuarioAtual.current = session.user.id;
        buscarPerfil(session.user.id);
      } else {
        setAutenticacaoPronta(true);
      }
    });

    const sub = autenticacaoService.onEstadoAutenticacaoAlterado((_event, session) => {
      if (session?.user) {
        refIdUsuarioAtual.current = session.user.id;
        buscarPerfil(session.user.id);
      } else {
        refIdUsuarioAtual.current = null;
        setUsuarioAtual(null);
        setAutenticacaoPronta(true);
      }
    });
    return () => sub.unsubscribe();
  }, [buscarPerfil]);

  useEffect(() => {
    if (!autenticacaoPronta) return;
    const idCamara = idCamaraOverride || usuarioAtual?.camara_id;

    buscarCamaras();
    buscarTemplates();
    buscarDadosSessao();
    buscarParlamentares();

    const canal = supabase.channel(`sessao_${idCamara || 'global'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessoes' }, buscarDadosSessao)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votacoes' }, buscarDadosSessao)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votos' }, buscarDadosSessao)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presencas' }, buscarDadosSessao)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, () => {
        buscarParlamentares();
        if (refIdUsuarioAtual.current) buscarPerfil(refIdUsuarioAtual.current);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parlamentares' }, buscarParlamentares)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuario_perfis' }, buscarParlamentares)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camaras' }, buscarCamaras)
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, [autenticacaoPronta, usuarioAtual?.camara_id, idCamaraOverride, buscarPerfil, buscarCamaras, buscarParlamentares, buscarDadosSessao, buscarTemplates]);

  // --- Actions ---

  const avancarFase = async () => {
    if (!sessao || !usuarioAtual?.temPermissao('SESSAO_AVANCAR')) return;
    const proximoIndice = sessao.fase_indice_atual + 1;
    if (proximoIndice >= fases.length) return;
    await sessaoService.avancarFase(sessao.id, proximoIndice);
  };

  const iniciarVotacao = async (idItem: string) => {
    if (!sessao || !usuarioAtual?.temPermissao('VOTACAO_INICIAR')) return;
    const faseAtual = fases[sessao.fase_indice_atual];
    if (!faseAtual?.permite_votacao) return alert('A fase atual não permite votação.');
    const novaVotacaoDto = await votacaoService.abrirVotacao(idItem);
    if (novaVotacaoDto) setVotacaoAtiva(Votacao.deDTO(novaVotacaoDto));
  };

  const registrarVoto = async (opcao: 'SIM' | 'NAO' | 'ABSTER') => {
    if (!usuarioAtual || !votacaoAtiva || !usuarioAtual.temPermissao('VOTAR')) return;
    await votacaoService.registrarVoto(votacaoAtiva.id, usuarioAtual.id, opcao);
  };

  const registrarPresenca = async () => {
    if (!usuarioAtual || !sessao) return;
    await sessaoService.registrarPresenca(sessao.id, usuarioAtual.id);
  };

  const criarSessao = async (dados: any) => {
    if (!usuarioAtual?.temPermissao('SESSAO_CRIAR') && !usuarioAtual?.eAdminGlobal()) throw new Error('Sem permissão.');
    const idCamara = usuarioAtual?.eAdminGlobal() ? dados.camara_id : usuarioAtual?.camara_id;
    const { error } = await sessaoService.criarSessao({ camara_id: idCamara, template_id: dados.template_id, data_inicio: dados.data_inicio });
    if (error) throw error;
    buscarDadosSessao();
  };

  const abrirSessao = async (id: string) => {
    if (!usuarioAtual?.ePresidente() && !usuarioAtual?.eAdminGlobal()) throw new Error('Apenas o Presidente pode abrir.');
    const { error } = await sessaoService.abrirSessao(id);
    if (error) throw error;
    buscarDadosSessao();
  };

  const encerrarSessao = async (id: string) => {
    const { error } = await sessaoService.finalizarSessao(id);
    if (error) throw error;
    buscarDadosSessao();
  };

  const criarCamara = async (dados: Partial<CamaraDTO>) => {
    if (!usuarioAtual?.eAdminGlobal()) throw new Error('Sem permissão.');
    const { error } = await camaraService.criarCamara(dados);
    if (error) throw error;
    buscarCamaras();
  };

  const criarUsuario = async (dados: any, perfilTipo: string) => {
    const idCamara = usuarioAtual?.eAdminGlobal() ? dados.camara_id : usuarioAtual?.camara_id;
    const resultado = await usuarioService.criarUsuario(dados, perfilTipo, idCamara);
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

  const sair = async () => {
    try {
      // 1. Limpa os estados locais IMEDIATAMENTE para travar a interface
      setUsuarioAtual(null);
      setSessao(null);
      refIdUsuarioAtual.current = null;
      
      // 2. Chama o logout do Supabase para limpar cookies/localStorage
      await autenticacaoService.logout();
      
      // 3. Força o estado de autenticação como pronta para os guards agirem
      setAutenticacaoPronta(true);
    } catch (e) {
      console.error("Erro ao sair:", e);
      // Em caso de erro, forçamos a limpeza local de qualquer forma
      setUsuarioAtual(null);
      window.location.href = '/login'; 
    }
  };

  return {
    sessao, sessoesAgendadas, fases, itens, votacaoAtiva, votos, presencas, parlamentares, camaras, templates, usuarioAtual, autenticacaoPronta, tempoRestante,
    faseAtual: fases[sessao?.fase_indice_atual || 0] || null,
    quorum: { presentes: presencas.length, total: parlamentares.length || 15 },
    avancarFase, iniciarVotacao, registrarVoto, registrarPresenca, criarCamara, criarUsuario, atualizarCamara, atualizarUsuario, criarSessao, abrirSessao, encerrarSessao, resetarSenhaUsuario,
    resultadoVotacao: votacaoAtiva?.calcularResultado(votos, parlamentares.length) || null,
    sair
  };
  }
