import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Sessao } from '../models/Sessao.model';
import { Votacao } from '../models/Votacao.model';
import { Usuario } from '../models/Usuario.model';
import { ConfiguracaoFaseDTO, PresencaDTO } from '../dtos/sessao.dto';
import { VotoDTO, ItemPautaDTO } from '../dtos/votacao.dto';
import { sessaoService } from '../services/sessao.service';
import { votacaoService } from '../services/votacao.service';
import { usuarioService } from '../services/usuario.service';
import { useAuthContext } from '../context/AuthContext';

export function useSessaoAtiva(idCamaraOverride?: string) {
  const { usuarioAtual, autenticacaoPronta } = useAuthContext();
  const [channelId] = useState(() => Math.random().toString(36).substring(7));
  
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [fases, setFases] = useState<ConfiguracaoFaseDTO[]>([]);
  const [itens, setItens] = useState<ItemPautaDTO[]>([]);
  const [votacaoAtiva, setVotacaoAtiva] = useState<Votacao | null>(null);
  const [votos, setVotos] = useState<VotoDTO[]>([]);
  const [presencas, setPresencas] = useState<PresencaDTO[]>([]);
  const [tempoRestante, setTempoRestante] = useState(0);
  
  // Parlamentares são necessários para quorum e listagem nominal de mesa
  const [parlamentares, setParlamentares] = useState<Usuario[]>([]);

  const buscarParlamentares = useCallback(async () => {
    const idCamara = idCamaraOverride || usuarioAtual?.camara_id;
    if (!idCamara && !usuarioAtual?.temPermissao('SISTEMA_ADMINISTRAR_TENANTS')) return;
    
    try {
      const dtos = await usuarioService.listarParlamentares(idCamara);
      setParlamentares(dtos.map(dto => Usuario.deDTO(dto)));
    } catch (e) {
      console.error("Erro ao buscar parlamentares na sessao ativa:", e);
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
        setPresencas([]);
      }
    } catch (e) {
      console.error("Erro ao buscar dados da sessão ativa:", e);
    }
  }, [usuarioAtual?.camara_id, idCamaraOverride]);

  // Engine: Realtime para Plenário em Andamento
  useEffect(() => {
    if (!autenticacaoPronta) return;
    const idCamara = idCamaraOverride || usuarioAtual?.camara_id;

    buscarParlamentares();
    buscarDadosSessao();

    // Canal dedicado exclusivamente ao andamento da Sessão
    const canal = supabase.channel(`sessao_ativa_${idCamara || 'global'}_${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessoes' }, buscarDadosSessao)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votacoes' }, buscarDadosSessao)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votos' }, buscarDadosSessao)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presencas' }, buscarDadosSessao)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, buscarParlamentares)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parlamentares' }, buscarParlamentares)
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, [autenticacaoPronta, usuarioAtual?.camara_id, idCamaraOverride, buscarParlamentares, buscarDadosSessao, channelId]);

  // --- Actions do Plenário ---
  
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

  const abrirSessao = async (id: string) => {
    if (!usuarioAtual?.temPermissao('SESSAO_ABRIR')) throw new Error('Apenas o Presidente pode abrir.');
    const { error } = await sessaoService.abrirSessao(id);
    if (error) throw error;
    buscarDadosSessao();
  };

  const encerrarSessao = async (id: string) => {
    const { error } = await sessaoService.finalizarSessao(id);
    if (error) throw error;
    buscarDadosSessao();
  };

  const faseAtual = fases[sessao?.fase_indice_atual || 0] || null;
  const quorum = { presentes: presencas.length, total: parlamentares.length || 15 };
  const resultadoVotacao = votacaoAtiva?.calcularResultado(votos, parlamentares.length) || null;

  return {
    sessao,
    fases,
    itens,
    votacaoAtiva,
    votos,
    presencas,
    parlamentares,
    tempoRestante,
    faseAtual,
    quorum,
    resultadoVotacao,
    avancarFase,
    iniciarVotacao,
    registrarVoto,
    registrarPresenca,
    abrirSessao,
    encerrarSessao
  };
}
