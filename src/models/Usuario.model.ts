import { ParlamentarDTO, PerfilTipo } from '../dtos/usuario.dto';

/**
 * Representa um usuário ou parlamentar no sistema.
 */
export class Usuario {
  public readonly id: string;
  public readonly nome: string;
  public readonly email: string;
  public readonly camara_id?: string;
  public readonly perfil: PerfilTipo;
  public readonly permissoes: string[];
  public readonly partido?: string;
  public readonly foto_url?: string;
  public readonly ativo: boolean;

  constructor(dados: ParlamentarDTO) {
    this.id = dados.id;
    this.nome = dados.nome;
    this.email = dados.email;
    this.camara_id = dados.camara_id;
    this.perfil = dados.perfil || 'VEREADOR';
    this.permissoes = dados.permissoes || [];
    this.partido = dados.partido;
    this.foto_url = dados.foto_url;
    this.ativo = dados.ativo;
  }

  public temPermissao(codigo: string): boolean {
    if (this.perfil === 'ADMIN') return true;
    return this.permissoes.includes(codigo);
  }

  public ePresidente(): boolean {
    return this.perfil === 'PRESIDENTE';
  }

  public eAdminGlobal(): boolean {
    return this.perfil === 'ADMIN';
  }

  public eParlamentar(): boolean {
    return ['VEREADOR', 'PRESIDENTE', 'SECRETARIO'].includes(this.perfil);
  }

  public static deDTO(dto: ParlamentarDTO): Usuario {
    return new Usuario(dto);
  }
}
