export type PerfilTipo = 'PRESIDENTE' | 'SECRETARIO' | 'VEREADOR' | 'ADMIN';

/**
 * Dados brutos do usuário da tabela 'usuarios'.
 */
export interface UsuarioDTO {
  id: string;
  nome: string;
  email: string;
  whatsapp?: string;
  ativo: boolean;
  camara_id?: string;
  created_at: string;
}

/**
 * Dados brutos do parlamentar (estende usuário) da tabela 'parlamentares'.
 */
export interface ParlamentarDTO extends UsuarioDTO {
  partido: string;
  cargo_mesa?: string;
  foto_url?: string;
  is_suplente: boolean;
  em_exercicio: boolean;
  perfil?: PerfilTipo; 
  permissoes?: string[]; 
}
