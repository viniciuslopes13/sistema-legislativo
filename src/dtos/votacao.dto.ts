export type StatusVotacao = 'NAO_INICIADA' | 'DISCUSSAO' | 'VOTANDO' | 'CONCLUIDA' | 'ANULADA';
export type TipoQuorum = 'MAIORIA_SIMPLES' | 'MAIORIA_ABSOLUTA' | 'DOIS_TERCOS';

/**
 * Representa um Item de Pauta bruto (tabela 'itens_pauta').
 */
export interface ItemPautaDTO {
  id: string;
  sessao_id: string;
  titulo_manual: string;
  ementa_manual: string;
  ordem: number;
  id_referencia_tramitacao?: string;
  tipo_materia: 'PL' | 'VETO' | 'REQUERIMENTO';
}

/**
 * Representa uma Votação bruta (tabela 'votacoes').
 */
export interface VotacaoDTO {
  id: string;
  item_id: string;
  status: StatusVotacao;
  tipo_quorum: TipoQuorum;
  hora_inicio?: string;
  hora_fim?: string;
}

/**
 * Representa um Voto individual bruto (tabela 'votos').
 */
export interface VotoDTO {
  id: string;
  votacao_id: string;
  usuario_id: string;
  opcao: 'SIM' | 'NAO' | 'ABSTER';
  is_voto_minerva: boolean;
  timestamp: string;
}
