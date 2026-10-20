import type { EstadoRP, EntradaFeed } from "./types";

/**
 * Estado inicial — transcrição exata de onde a conversa parou
 * (roleplat.txt, linhas 24.700–27.728). Nenhum número inventado aqui:
 * holding $3,8tri, caixa $13,3bi, pessoal $37,395bi, Space Coin $55.
 */
export function estadoInicial(): EstadoRP {
  return {
    turno: 0,
    data: "2026 — pós Operação Mãos Limpas",
    seed: 6767,

    caixa: 13.3, // holding, pós Space Estates ($3,95bi) e contratações ($2,5bi)
    pessoal: 37.395, // bolso do Ryan
    coin: 55, // Space Coin, tesouro $330bi
    holding: 3800, // $3,8 trilhões

    heat: 55, // golpe corporativo exposto, mas mídia já domada (Globo censurada)
    moral: 74, // bônus $250mi + PLR 12 salários + Space Coin pra todo mundo
    aprovacao: 66, // trending "Obrigado, Ryan", Operação Renascer prometida

    relacoes: {
      "Sofia Mendes": 92,
      Axiom: 100,
      "Daniel Cross": -35,
      "Jeff Williams": 85,
      "Elon Musk": 58,
      "Bob Iger": 55,
      "Tim Cook": -70,
      "Isabella Mendes": 80,
      "Júlia Mendes": 68,
      "Ricardo Salles": 90,
      "Dr. Henrique Valladares": 88,
      IShowSpeed: 75,
      "Celo Tavares": 82,
      "Victor Vit Salomão": 80,
      "Noah Dalbert Mendes": 100,
      INDEX: 70,
      "Coach kkooma": 76,
      "paiN Gaming": 40,
      FURIA: 25,
    },

    divisoes: [
      {
        id: "media",
        nome: "Space Media",
        nota: "Paramount+ 300mi assinantes · SBT · Globo censurada · spaceNFL/NBA rights $60bi",
      },
      {
        id: "tech",
        nome: "Space Tech",
        nota: "Cláusula 14.8 assinada · 500k iPhones/dia · receita $350mi no dia 1 — NA GELADEIRA",
      },
      { id: "ai", nome: "Space AI", nota: "Elon Musk CEO, 7% (punido de heliponto VIP)" },
      {
        id: "foundries",
        nome: "Space Foundries",
        nota: "Jeff Williams · $80mi/ano + $150mi bônus · 20 engenheiros da Apple",
      },
      {
        id: "esports",
        nome: "Space Esports",
        nota: "HOPE TARZAN KYOUMA INDEX KAEL · 6x CBLOL, 3x Worlds, 2x MSI, 1 EWC, 1 LTA",
      },
      { id: "ocean", nome: "Space Ocean", nota: "Ex-NOAA · Dr. Elias Vance · sede Ilhabela" },
      {
        id: "estates",
        nome: "Space Estates",
        nota: "$3,95bi investidos · $3,2bi em sinais · obras CONGELADAS até lucro",
      },
      { id: "ilha", nome: "Ilha MR", nota: "Exumas · $500mi de lucro pré-hóspede · CEO Isabella" },
      { id: "coin", nome: "Space Coin", nota: "$55 · market cap $485bi · tesouro $330bi" },
      {
        id: "interactive",
        nome: "Space Interactive",
        nota: "Rockstar + Nintendo ($65bi) · Space Legends ~2030 · Celo em Kyoto",
      },
      {
        id: "gov",
        nome: "Space Government",
        nota: "Sofia na Fazenda · Axiom na Comunicação · 27 governadores-student em bootcamp",
      },
      {
        id: "basic",
        nome: "Space Basic / Renascer",
        nota: "Casa de $10 · 1 milhão de casas · reality 'A Ascensão'",
      },
    ],

    pendencias: [
      {
        id: "apple",
        nome: "Operação Maçã Podre — na geladeira",
        descricao:
          "Contrato 14.8 assinado, Jeff Williams recrutado, dia 1 rodando. Ryan mandou segurar o gatilho.",
        gatilhos: [
          "apple",
          "maçã",
          "maca",
          "tim cook",
          "iphone",
          "gatilho",
          "cláusula 14",
          "clausula 14",
        ],
        passo: 0,
        etapas: [
          "Dia 1: 500.000 iPhones, custo -40%, $350mi de receita pra Space. Faca na geladeira.",
          "Week 2: chip xAI/Space embutido passa nos testes da Apple. Tim Cook descobre a mineração de Space Coin em background.",
          "Crise: DOJ abre investigação. Wall Street pede cabeça da Space. Tim escolhe entre o contrato e a prisão.",
          "Resolução: Apple vira subsidiária tech da Space por $1 (valor de mercado tomado por dívida, padrão Brasil).",
        ],
        ativa: true,
      },
      {
        id: "estates",
        nome: "Space Estates — obras congeladas",
        descricao:
          "6 projetos, $3,95bi gastos, $3,2bi de sinais (30% pré-vendido). Ryan ordenou esperar o lucro.",
        gatilhos: [
          "estates",
          "imóvel",
          "imovel",
          "obra",
          "bel-air",
          "mansion",
          "prédio",
          "predio",
          "construir",
        ],
        passo: 0,
        etapas: [
          "Obras paradas. Magnatas cobrando entrega. Bob Iger quer a de Bel-Air.",
          "Primeiro lote de sinais converte: $1,9bi entram. Obras liberadas em SP e Leblon.",
          "Entrega da primeira unidade: $200mi por unidade, fila de leilão silencioso de 50 compradores.",
          "Space Estates vira o braço imobiliário mais caro do mundo. Receita projetada $12bi.",
        ],
        ativa: true,
      },
      {
        id: "renascer",
        nome: "Operação Renascer",
        descricao: "1 milhão de casas de $10, escritura, Espaços MR. Substituiu a Maré Vermelha.",
        gatilhos: ["renascer", "casa", "favela", "moradia", "space basic", "verticaliz"],
        passo: 0,
        etapas: [
          "10.000 casas-piloto entregues em Campinas. Reality 'A Ascensão' gravado.",
          "500.000 unidades em obra. Aprovação do povo dispara, oposição fala em 'clientelismo orbital'.",
          "1 milhão de escrituras emitidas. Space vira maior proprietário de terra do Brasil.",
          "Conclusão: favelas verticais com logo MR. Povo canta o hino da Space. Sofia exige nota fiscal de cada tijolo.",
        ],
        ativa: true,
      },
      {
        id: "governadores",
        nome: "PEC 30→21 · 27 governadores-student",
        descricao:
          "27 alunos da Space University em bootcamp com Salles e Sofia. PEC baixando a idade de 30 pra 21.",
        gatilhos: [
          "governador",
          "pec",
          "eleição",
          "eleicao",
          "senado",
          "deputado",
          "impeachment",
          "congresso",
        ],
        passo: 0,
        etapas: [
          "Bootcamp de 3 meses no Planalto. Banca Space se organiza.",
          "PEC 30→21 aprovada em 2 turnos com apoio dos 27. Oposição chama de 'golpe eleitoral'.",
          "27 eleições estaduais disputadas com candidatos Space. Governo do Goiás (terra natal) já garantido.",
          "Bancada Space domina o Congresso. Salles redige a PEC do mandato biônico... Ryan ri e aprova.",
        ],
        ativa: true,
      },
      {
        id: "index",
        nome: "INDEX — decisão de carreira",
        descricao:
          "Ofertas JDG $1,4M/mês, T1 $1,1M/mês, Liquid $1M/mês, Gen.G $950k, Space $900k + multa $60M. Ele ainda não sabe.",
        gatilhos: [
          "index",
          "t1",
          "jdg",
          "lck",
          "faker",
          "contrato",
          "transferência",
          "transferencia",
          "adc",
          "renovar",
        ],
        passo: 0,
        etapas: [
          "Ele ainda não sabe. Mídia especula, T1 solta teaser. Multa de $60M segura tudo.",
          "INDEX pede reunião fechada com Ryan. Quer ouvir a renovação antes de decidir.",
          "Decisão: ele fica pra jogar o Worlds pelo Brasil contra a T1 — ou assina com a LCK e o Brasil perde o maior.",
          "Consequência: se ficar, Space renova por $900k/mês + multa $60M e vai como favorito pro Worlds. Se sair, vende por $1,4M/mês e caixa recebe $60M de multa ou perde o ADC.",
        ],
        ativa: true,
      },
      {
        id: "ewc",
        nome: "EWC 2026 — quartas de final",
        descricao: "Space nas quartas da Esports World Cup. Adversário a definir.",
        gatilhos: [
          "ewc",
          "quartas",
          "campeonato",
          "jogo",
          "serie",
          "draft",
          "lpl",
          "lck",
          "skt",
          "gen.g",
        ],
        passo: 0,
        etapas: [
          "Chaveamento sorteado: adversário = Gen.G (LCK). Mídia brasileira já vê semifinal.",
          "Série BO5: Space abre 1x0 com draft de kkooma, mas GEN empata no macro.",
          "Glass cannon game 5: INDEX entrega penta, Space classifica pra semis.",
          "Semi contra a T1: o duelo INDEX x Faker que ele prometeu ao mundo.",
        ],
        ativa: true,
      },
      {
        id: "muralha",
        nome: "Muralha de Greenwich",
        descricao:
          "Paparazzi flagged. GIGN/Mossad, jammers, caças, multa $10mi por foto. Compra de 3–5km ao redor.",
        gatilhos: [
          "paparazzi",
          "greenwich",
          "muralha",
          "cortina",
          "fotógrafo",
          "fotografo",
          "segurança",
          "seguranca",
          "casa",
        ],
        passo: 0,
        etapas: [
          "Perímetro fechado. Multa de $10mi aplicada em 3 fotos do NYT. Jammers ativos.",
          "Um drone da TMZ passa por baixo do jammer. Axiom aciona caça da Guarda Nacional suíça.",
          "Compra definitiva das propriedades num raio de 5km. Família sai da mídia pra sempre.",
          "Greenwich vira 'Zona MR': nem o Google Maps mostra a casa do Noah.",
        ],
        ativa: true,
      },
    ],

    feed: [abertura()],
    config: {
      habilitada: false,
      baseUrl: "https://api.openai.com/v1",
      apiKey: "",
      modelo: "gpt-4o-mini",
    },
  };
}

/** Cena de retomada — exatamente a última cena do arquivo (linha ~27.700). */
function abertura(): EntradaFeed {
  return {
    id: "abertura",
    turno: 0,
    data: "2026 — pós Operação Mãos Limpas",
    titulo: "O Monitor Desligado",
    cena: 'Axiom fechou o terminal com um clique seco. "Dorme, boss man. A engrenagem tá rodando sozinha." Ele apagou a luz do escritório no 129º andar, pegou o Macallan de 1926 no avesso da geladeira do andar dele e subiu pro duplex do 128º. Do topo da Torre de Brasília, o logo MR brilhava em cima da Esplanada — mais alto que o Planalto, batendo de frente com o Palácio do Alvorada, que agora era propriedade privada de um bebê de poucos meses. Lá embaixo, em Greenwich, Sofia já tinha desligado a luz do quarto do Noah. O holding fechou o dia em $3,8 trilhões. O caixa, em $13,3 bilhões. O pessoal, $37,395 bilhões. A Apple tá na geladeira. As obras do Estates tão congeladas esperando lucro. O INDEX ainda não sabe o que vai fazer da vida. E o mundo tá esperando o próximo golpe do garoto de 19 anos que virou dono de um país sem atirar um tiro.',
    efeitos: [
      "Estado importado de roleplat.txt — 27.728 linhas, zero alteração.",
      "Pendências abertas: Maçã Podre · Estates · Renascer · PEC 21 · INDEX · EWC quartas · Muralha.",
      "Fichas salvas. O mundo continua de onde parou.",
    ],
    delta: {},
    narradoPor: "engine",
    reacoes: {
      midia: "NYT segura a manchete: 'O garoto dorme, o império não'.",
      mercado: "Futuro da Space Coin estável em $55, volatilidade mínima no after.",
      povo: "Trending #1: 'Bom dia, Ryan' — 12h seguidas.",
    },
    escolhas: [
      { rotulo: "Acordar e dar o próximo golpe", categoria: "acaoLivre" },
      { rotulo: "Ligar pro INDEX e fechar a renovação", categoria: "esports", detalhe: "INDEX" },
      {
        rotulo: "Ver se a maçã já amadureceu na geladeira",
        categoria: "investimento",
        detalhe: "Apple cláusula 14.8",
      },
      { rotulo: "Chamar Sofia pro café da manhã na Torre", categoria: "familia", detalhe: "Sofia" },
    ],
  };
}
