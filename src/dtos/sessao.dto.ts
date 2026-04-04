export type StatusSessao = 'AGUARDANDO' | 'EM_CURSO' | 'SUSPENSA' | 'FINALIZADA';

/**
 * Representa uma Sessão Legislativa bruta (tabela 'sessoes').
 */
export interface SessaoDTO {
  id: string;
  camara_id: string;
  template_id: string;
  data_inicio: string;
  status: StatusSessao;
  fase_indice_atual: number;
}

/**
 * Representa uma Fase do Rito bruta (tabela 'configuracao_fases').
 */
export interface ConfiguracaoFaseDTO {
  id: string;
  template_id: string;
  nome_fase: string;
  ordem: number;
  tempo_cronometro: number;
  permite_votacao: boolean;
  exige_quorum_minimo: boolean;
  percentual_quorum: number;
}

/**
 * Representa um registro de Presença bruto (tabela 'presencas').
 */
export interface PresencaDTO {
  id: string;
  sessao_id: string;
  usuario_id: string;
  timestamp: string;
  manual: boolean;
}
