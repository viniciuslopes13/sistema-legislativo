/**
 * Representa uma Câmara Municipal bruta (tabela 'camaras').
 */
export interface CamaraDTO {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  logo_url?: string;
  ativo: boolean;
  created_at: string;
}

/**
 * Representa uma Operação (Permissão) bruta (tabela 'operacoes').
 */
export interface OperacaoDTO {
  id: string;
  codigo: string;
  descricao: string;
}

/**
 * Representa um Perfil (RBAC) bruto (tabela 'perfis').
 */
export interface PerfilDTO {
  id: string;
  nome: string;
  tipo_base: string;
  camara_id?: string;
}
