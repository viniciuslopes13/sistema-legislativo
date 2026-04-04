import { SessaoDTO, StatusSessao } from '../dtos/sessao.dto';

/**
 * Representa uma Sessão Legislativa no sistema.
 * Encapsula o estado e a lógica de negócio do rito legislativo.
 */
export class Sessao {
  public readonly id: string;
  public readonly camara_id: string;
  public readonly template_id: string;
  public readonly data_inicio: string;
  public status: StatusSessao;
  public fase_indice_atual: number;

  constructor(dados: SessaoDTO) {
    this.id = dados.id;
    this.camara_id = dados.camara_id;
    this.template_id = dados.template_id;
    this.data_inicio = dados.data_inicio;
    this.status = dados.status;
    this.fase_indice_atual = dados.fase_indice_atual;
  }

  public estaEmCurso(): boolean {
    return this.status === 'EM_CURSO';
  }

  public estaFinalizada(): boolean {
    return this.status === 'FINALIZADA';
  }

  public estaAguardando(): boolean {
    return this.status === 'AGUARDANDO';
  }

  public obterDataFormatada(): string {
    return new Date(this.data_inicio).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  public static deDTO(dto: SessaoDTO): Sessao {
    return new Sessao(dto);
  }

  public static listaDeDTO(lista: SessaoDTO[]): Sessao[] {
    return lista.map(dto => Sessao.deDTO(dto));
  }
}
