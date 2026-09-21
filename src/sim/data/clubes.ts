import type { Clube, Jogador, Posicao } from "../types";

/**
 * DADOS DE DEMONSTRAÇÃO.
 * Nomes de clubes reais usados apenas como rótulo. Elencos e notas são
 * SINTÉTICOS, gerados pelo simulador — não representam elencos oficiais,
 * atuais ou quaisquer ratings de terceiros.
 */

interface Semente {
  nome: string;
  abrev: string;
  nota: number;
}

const s = (nome: string, abrev: string, nota: number): Semente => ({
  nome,
  abrev,
  nota,
});

export const SERIE_A: Semente[] = [
  s("Flamengo", "FLA", 84),
  s("Palmeiras", "PAL", 84),
  s("Botafogo", "BOT", 81),
  s("São Paulo", "SAO", 79),
  s("Corinthians", "COR", 78),
  s("Fluminense", "FLU", 77),
  s("Cruzeiro", "CRU", 78),
  s("Atlético Mineiro", "CAM", 78),
  s("Grêmio", "GRE", 76),
  s("Internacional", "INT", 76),
  s("Bahia", "BAH", 75),
  s("Fortaleza", "FOR", 75),
  s("Santos", "SAN", 74),
  s("Vasco da Gama", "VAS", 74),
  s("Red Bull Bragantino", "RBB", 73),
  s("Athletico Paranaense", "CAP", 73),
  s("Vitória", "VIT", 70),
  s("Juventude", "JUV", 69),
  s("Criciúma", "CRI", 68),
  s("Cuiabá", "CUI", 68),
];

export const SERIE_B: Semente[] = [
  s("Sport Recife", "SPT", 71),
  s("Ceará", "CEA", 70),
  s("Goiás", "GOI", 70),
  s("Mirassol", "MIR", 69),
  s("Novorizontino", "NOV", 69),
  s("Coritiba", "CFC", 68),
  s("América Mineiro", "AME", 68),
  s("Avaí", "AVA", 67),
  s("Chapecoense", "CHA", 66),
  s("Ponte Preta", "PON", 66),
  s("Guarani", "GUA", 65),
  s("Operário Ferroviário", "OPE", 65),
  s("CRB", "CRB", 65),
  s("Vila Nova", "VIL", 64),
  s("Botafogo-SP", "BSP", 64),
  s("Paysandu", "PAY", 63),
  s("Amazonas", "AMA", 62),
  s("Ituano", "ITU", 62),
  s("Brusque", "BRU", 61),
  s("Santa Cruz", "STA", 61),
];

export const SERIE_C: Semente[] = [
  s("Remo", "REM", 62),
  s("Londrina", "LON", 60),
  s("São Bernardo", "SBE", 60),
  s("Volta Redonda", "VOL", 59),
  s("Athletic Club", "ATH", 59),
  s("Figueirense", "FIG", 59),
  s("ABC", "ABC", 58),
  s("Náutico", "NAU", 58),
  s("Ferroviária", "FER", 58),
  s("Ypiranga", "YPI", 57),
  s("Aparecidense", "APA", 56),
  s("Botafogo-PB", "BPB", 56),
  s("CSA", "CSA", 56),
  s("Confiança", "CON", 55),
  s("Sampaio Corrêa", "SAM", 55),
  s("São José-RS", "SJO", 54),
  s("Tombense", "TOM", 54),
  s("Caxias", "CAX", 54),
  s("Floresta", "FLO", 53),
  s("Ferroviário", "FEC", 53),
];

export const PREMIER: Semente[] = [
  s("Manchester City", "MCI", 88),
  s("Arsenal", "ARS", 87),
  s("Liverpool", "LIV", 87),
  s("Chelsea", "CHE", 84),
  s("Tottenham", "TOT", 82),
  s("Manchester United", "MUN", 82),
  s("Newcastle", "NEW", 81),
  s("Aston Villa", "AVL", 80),
  s("Brighton", "BHA", 78),
  s("West Ham", "WHU", 77),
  s("Crystal Palace", "CRY", 76),
  s("Everton", "EVE", 75),
  s("Fulham", "FUL", 75),
  s("Brentford", "BRE", 75),
  s("Nottingham Forest", "NFO", 74),
  s("Wolverhampton", "WOL", 74),
  s("Bournemouth", "BOU", 74),
  s("Leeds United", "LEE", 72),
  s("Burnley", "BUR", 70),
  s("Sunderland", "SUN", 70),
];

export const LALIGA: Semente[] = [
  s("Real Madrid", "RMA", 89),
  s("Barcelona", "BAR", 88),
  s("Atlético de Madrid", "ATM", 85),
  s("Athletic Club Bilbao", "ATB", 81),
  s("Real Sociedad", "RSO", 79),
  s("Villarreal", "VIL", 79),
  s("Real Betis", "BET", 78),
  s("Sevilla", "SEV", 77),
  s("Valencia", "VAL", 75),
  s("Celta de Vigo", "CEL", 75),
  s("Girona", "GIR", 75),
  s("Osasuna", "OSA", 73),
  s("Rayo Vallecano", "RAY", 73),
  s("Getafe", "GET", 72),
  s("Mallorca", "MLL", 72),
  s("Espanyol", "ESP", 71),
  s("Alavés", "ALA", 71),
  s("Elche", "ELC", 69),
  s("Levante", "LEV", 68),
  s("Real Oviedo", "OVI", 67),
];

export const CALCIO: Semente[] = [
  s("Internazionale", "INT", 86),
  s("Juventus", "JUV", 84),
  s("Milan", "MIL", 84),
  s("Napoli", "NAP", 84),
  s("Atalanta", "ATA", 83),
  s("Roma", "ROM", 82),
  s("Lazio", "LAZ", 80),
  s("Fiorentina", "FIO", 79),
  s("Bologna", "BOL", 78),
  s("Torino", "TOR", 75),
  s("Udinese", "UDI", 74),
  s("Genoa", "GEN", 73),
  s("Como", "COM", 73),
  s("Cagliari", "CAG", 72),
  s("Sassuolo", "SAS", 72),
  s("Parma", "PAR", 71),
  s("Verona", "VER", 70),
  s("Lecce", "LEC", 69),
  s("Pisa", "PIS", 68),
  s("Cremonese", "CRE", 68),
];

export const BUNDESLIGA: Semente[] = [
  s("Bayern de Munique", "BAY", 88),
  s("Bayer Leverkusen", "B04", 84),
  s("Borussia Dortmund", "BVB", 83),
  s("RB Leipzig", "RBL", 82),
  s("Eintracht Frankfurt", "SGE", 79),
  s("VfB Stuttgart", "VFB", 78),
  s("Freiburg", "SCF", 76),
  s("Werder Bremen", "SVW", 74),
  s("Hoffenheim", "TSG", 74),
  s("Wolfsburg", "WOB", 74),
  s("Mainz 05", "M05", 73),
  s("Borussia M'gladbach", "BMG", 73),
  s("Union Berlin", "FCU", 72),
  s("Augsburg", "FCA", 71),
  s("St. Pauli", "STP", 69),
  s("Heidenheim", "HDH", 68),
  s("Hamburgo", "HSV", 68),
  s("Köln", "KOE", 68),
];

export const LIGUE1: Semente[] = [
  s("Paris Saint-Germain", "PSG", 88),
  s("Marseille", "OM", 81),
  s("Monaco", "ASM", 80),
  s("Lyon", "OL", 78),
  s("Lille", "LIL", 78),
  s("Nice", "NIC", 76),
  s("Lens", "RCL", 75),
  s("Rennes", "REN", 75),
  s("Strasbourg", "RCS", 74),
  s("Nantes", "FCN", 71),
  s("Toulouse", "TFC", 71),
  s("Brest", "SB29", 71),
  s("Auxerre", "AJA", 69),
  s("Angers", "SCO", 68),
  s("Le Havre", "HAC", 68),
  s("Metz", "FCM", 67),
  s("Lorient", "FCL", 67),
  s("Paris FC", "PFC", 67),
];

export const SUL_AMERICANOS: Semente[] = [
  s("River Plate", "RIV", 81),
  s("Boca Juniors", "BOC", 80),
  s("Racing", "RAC", 78),
  s("Independiente", "IND", 75),
  s("Estudiantes", "EST", 75),
  s("Vélez Sarsfield", "VEL", 75),
  s("Nacional", "NAC", 74),
  s("Peñarol", "PEN", 74),
  s("Colo-Colo", "COL", 73),
  s("Universidad de Chile", "UCH", 72),
  s("Olimpia", "OLI", 72),
  s("Cerro Porteño", "CER", 72),
  s("Libertad", "LIB", 72),
  s("Atlético Nacional", "ATN", 74),
  s("Junior", "JUN", 71),
  s("Millonarios", "MIL", 70),
  s("LDU Quito", "LDU", 72),
  s("Barcelona de Guayaquil", "BSC", 71),
  s("Alianza Lima", "ALI", 70),
  s("Universitario", "UNI", 70),
  s("Bolívar", "BOL", 71),
  s("The Strongest", "STR", 69),
];

export const RESTO_DO_MUNDO: Semente[] = [
  s("Al Hilal", "HIL", 78),
  s("Al Ahly", "AHL", 73),
  s("Wydad", "WYD", 70),
  s("Espérance", "ESP", 70),
  s("Monterrey", "MTY", 73),
  s("Pachuca", "PAC", 72),
  s("Inter Miami", "MIA", 72),
  s("Seattle Sounders", "SEA", 70),
  s("Urawa Reds", "URA", 70),
  s("Ulsan HD", "ULS", 70),
  s("Auckland City", "AUC", 60),
  s("Al Ain", "AIN", 69),
];

/* ------------------------------ geração ---------------------------------- */

const PRIMEIROS = [
  "Lucas","Gabriel","Matheus","Rafael","Bruno","Diego","Thiago","Pedro","João","Felipe",
  "Carlos","Eduardo","Marcos","Vinícius","André","Rodrigo","Luan","Igor","Caio","Daniel",
  "Marco","Luca","Nico","Samu","Jonas","Erik","Tom","Alex","Yuri","Iker",
];
const SEGUNDOS = [
  "Silva","Souza","Oliveira","Pereira","Costa","Almeida","Rocha","Barbosa","Ribeiro","Cardoso",
  "Moreira","Fernandes","Nunes","Teixeira","Machado","Gomes","Araújo","Duarte","Vieira","Pinto",
  "Moretti","Keller","Dubois","Navarro","Lindqvist","Kovac","Romero","Blake","Adeyemi","Sato",
];

const ESTRUTURA: Posicao[] = [
  "GOL","GOL","ZAG","ZAG","ZAG","ZAG","LAT","LAT","LAT","LAT",
  "VOL","VOL","VOL","MEI","MEI","MEI","ATA","ATA","ATA","ATA",
];

function ruido(range: number) {
  return Math.round((Math.random() * 2 - 1) * range);
}

function gerarElenco(clubeId: string, notaBase: number): Jogador[] {
  return ESTRUTURA.map((posicao, i) => {
    const titular = i < 11;
    const nota = Math.max(
      40,
      Math.min(99, notaBase + (titular ? 2 : -4) + ruido(4)),
    );
    return {
      id: `${clubeId}_j${i + 1}`,
      nome: `${PRIMEIROS[Math.floor(Math.random() * PRIMEIROS.length)]} ${
        SEGUNDOS[Math.floor(Math.random() * SEGUNDOS.length)]
      }`,
      posicao,
      nota,
    };
  });
}

const CORES = [
  "#16a34a","#dc2626","#2563eb","#eab308","#0ea5e9","#f97316",
  "#a855f7","#14b8a6","#ef4444","#22c55e",
];

export function criarClube(sem: Semente, pais: string, idx: number): Clube {
  const id = `${pais}-${sem.abrev}-${idx}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
  return {
    id,
    nome: sem.nome,
    abrev: sem.abrev,
    pais,
    cor: CORES[(sem.nome.length + idx) % CORES.length],
    notaBase: sem.nota,
    elenco: gerarElenco(id, sem.nota),
    historico: [],
  };
}

export interface BaseDados {
  clubes: Record<string, Clube>;
  grupos: Record<string, string[]>;
}

export function criarBaseInicial(): BaseDados {
  const clubes: Record<string, Clube> = {};
  const grupos: Record<string, string[]> = {};

  const registrar = (chave: string, sementes: Semente[], pais: string) => {
    grupos[chave] = sementes.map((sem, i) => {
      const clube = criarClube(sem, pais, i);
      clubes[clube.id] = clube;
      return clube.id;
    });
  };

  registrar("serie-a", SERIE_A, "BRA");
  registrar("serie-b", SERIE_B, "BRA");
  registrar("serie-c", SERIE_C, "BRA");
  registrar("premier-league", PREMIER, "ENG");
  registrar("la-liga", LALIGA, "ESP");
  registrar("serie-a-italia", CALCIO, "ITA");
  registrar("bundesliga", BUNDESLIGA, "GER");
  registrar("ligue-1", LIGUE1, "FRA");
  registrar("conmebol", SUL_AMERICANOS, "SAM");
  registrar("mundo", RESTO_DO_MUNDO, "MUN");

  return { clubes, grupos };
}
