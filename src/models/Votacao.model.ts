import { VotacaoDTO, VotoDTO, StatusVotacao, TipoQuorum } from '../dtos/votacao.dto';

/**
 * Representa uma deliberação (votação) de uma matéria legislativa.
 */
export class Votacao {
  public readonly id: string;
  public readonly item_id: string;
  public status: StatusVotacao;
  public tipo_quorum: TipoQuorum;
  public hora_inicio?: string;
  public hora_fim?: string;

  constructor(dados: VotacaoDTO) {
    this.id = dados.id;
    this.item_id = dados.item_id;
    this.status = dados.status;
    this.tipo_quorum = dados.tipo_quorum;
    this.hora_inicio = dados.hora_inicio;
    this.hora_fim = dados.hora_fim;
  }

  public calcularResultado(votos: VotoDTO[], totalParlamentares: number) {
    const sim = votos.filter(v => v.opcao === 'SIM').length;
    const nao = votos.filter(v => v.opcao === 'NAO').length;
    const abstencoes = votos.filter(v => v.opcao === 'ABSTER').length;

    let aprovado = false;
    let motivo = "";

    switch (this.tipo_quorum) {
      case 'MAIORIA_SIMPLES':
        aprovado = sim > nao;
        motivo = "Maioria simples dos votos válidos.";
        break;
      case 'MAIORIA_ABSOLUTA':
        const maioriaAbsoluta = Math.floor(totalParlamentares / 2) + 1;
        aprovado = sim >= maioriaAbsoluta;
        motivo = `Exige no mínimo ${maioriaAbsoluta} votos favoráveis.`;
        break;
      case 'DOIS_TERCOS':
        const doisTercos = Math.ceil((2 / 3) * totalParlamentares);
        aprovado = sim >= doisTercos;
        motivo = `Exige 2/3 (${doisTercos} votos de ${totalParlamentares}).`;
        break;
    }

    return { sim, nao, abstencoes, totalVotos: votos.length, aprovado, motivo };
  }

  public estaAberta(): boolean {
    return this.status === 'VOTANDO';
  }

  public static deDTO(dto: VotacaoDTO): Votacao {
    return new Votacao(dto);
  }
}
