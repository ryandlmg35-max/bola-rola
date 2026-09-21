/**
 * Camada de serviço de dados.
 *
 * Preparada para Football-Data.org ou API-Football. As chaves NUNCA ficam no
 * frontend: a busca real deve ser feita por uma função de servidor usando um
 * segredo do projeto. Enquanto não houver credencial configurada, o simulador
 * usa os conjuntos locais de DEMONSTRAÇÃO.
 */

export type FonteDados = "demo" | "football-data" | "api-football";

export interface RespostaAtualizacao {
  fonte: FonteDados;
  credencialConfigurada: boolean;
  mensagem: string;
}

export async function buscarLigas(): Promise<RespostaAtualizacao> {
  // Nenhuma credencial está configurada neste projeto.
  return {
    fonte: "demo",
    credencialConfigurada: false,
    mensagem:
      "Nenhuma credencial de API configurada. Os dados exibidos são de demonstração (clubes reais apenas como rótulo; elencos e notas são sintéticos, não oficiais).",
  };
}
