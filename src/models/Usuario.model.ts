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
  public readonly whatsapp?: string;
  public readonly cargo_mesa?: string;
  public readonly is_suplente: boolean;
  public readonly em_exercicio: boolean;
  public readonly ativo: boolean;
  public readonly senha_alterada: boolean;
  public readonly perfis_ids: string[];

  constructor(dados: ParlamentarDTO) {
    this.id = dados.id;
    this.nome = dados.nome;
    this.email = dados.email;
    this.camara_id = dados.camara_id;
    this.perfil = dados.perfil || 'VEREADOR';
    this.permissoes = dados.permissoes || [];
    this.partido = dados.partido;
    this.foto_url = dados.foto_url;
    this.whatsapp = dados.whatsapp;
    this.cargo_mesa = dados.cargo_mesa;
    this.is_suplente = dados.is_suplente || false;
    this.em_exercicio = dados.em_exercicio ?? true;
    this.ativo = dados.ativo;
    this.senha_alterada = dados.senha_alterada ?? true;
    this.perfis_ids = dados.perfis_ids || [];
  }

  public temPermissao(codigo: string): boolean {
    return this.permissoes.includes(codigo);
  }


  public static deDTO(dto: ParlamentarDTO): Usuario {
    return new Usuario(dto);
  }
}
