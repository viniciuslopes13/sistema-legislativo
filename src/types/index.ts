export type PerfilTipo = 'PRESIDENTE' | 'SECRETARIO' | 'VEREADOR' | 'ADMIN';

export interface Camara {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  logo_url?: string;
  ativo: boolean;
  createdAt: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  whatsapp?: string;
  ativo: boolean;
  perfil?: PerfilTipo;
  camaraId?: string; // Optional for Super Admin
}

export interface Parlamentar extends Usuario {
  partido: string;
  cargo_mesa?: string;
  foto_url?: string;
  is_suplente: boolean;
  em_exercicio: boolean;
}

export interface Sessao {
  id: string;
  camaraId: string;
  template_id: string;
  data_inicio: string;
  status: 'AGUARDANDO' | 'EM_CURSO' | 'FINALIZADA';
  fase_indice_atual: number;
}

export interface ConfiguracaoFase {
  id: string;
  template_id: string;
  nome_fase: string;
  ordem: number;
  tempo_cronometro: number;
  permite_votacao: boolean;
  exige_quorum_minimo: boolean;
  percentual_quorum: number;
}

export interface ItemPauta {
  id: string;
  sessao_id: string;
  titulo_manual: string;
  ementa_manual: string;
  ordem: number;
  tipo_materia: 'PL' | 'VETO' | 'REQUERIMENTO';
}

export interface Votacao {
  id: string;
  status: 'NAO_INICIADA' | 'VOTANDO' | 'CONCLUIDA';
  tipo_quorum: 'MAIORIA_SIMPLES' | 'MAIORIA_ABSOLUTA' | 'DOIS_TERCOS';
  hora_inicio?: string;
  hora_fim?: string;
}

export interface Voto {
  id: string;
  votacao_id: string;
  usuario_id: string;
  opcao: 'SIM' | 'NAO' | 'ABSTER';
  is_voto_minerva: boolean;
  timestamp: string;
}

export interface Presenca {
  id: string;
  sessao_id: string;
  usuario_id: string;
  timestamp: string;
}
