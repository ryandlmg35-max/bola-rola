import type { EstadoRP, MsgGeral } from "./types";
import { fmtUSD } from "./engine";
import { rng, sorteia } from "./rng";
import { PERFIS_CEO } from "./ceos";
import { resumoMensal } from "./mundo";

/**
 * Chat geral do 130º: o Ryan fala com o Axiom no canal aberto da torre.
 * Sofia, CEOs e o conselho inteiro estão no canal — tudo que é dito aqui
 * repercutE no império. O chat NÃO move dinheiro nem gasta semana: ele move
 * indicadores (heat, moral, aprovação, tensão, relações, humor da Sofia)
 * numa escala pequena e determinística. Ordem de gestão continua na caixa
 * de ordem, que custa uma semana.
 */

export interface ImpactoConversa {
  /** Deltas aplicados direto no estado — sempre pequenos, sempre clampados. */
  heat: number;
  moral: number;
  aprovacao: number;
  tensao: number;
  relacoes: Record<string, number>;
  sofiaEstresse: number;
  sofiaEnergia: number;
  /** Linha legível tipo "aprovação +2 · tensão do conselho -1". */
  chips: string[];
  /** Magnitude total — define se vira entrada de feed. */
  peso: number;
}

const VAZIO: ImpactoConversa = {
  heat: 0,
  moral: 0,
  aprovacao: 0,
  tensao: 0,
  relacoes: {},
  sofiaEstresse: 0,
  sofiaEnergia: 0,
  chips: [],
  peso: 0,
};

/**
 * O que cada fala no canal aberto faz com o império — determinístico,
 * baseado em tema. Fala neutra não move nada; fala com posição move.
 */
export function impactoConversa(estado: EstadoRP, texto: string): ImpactoConversa {
  const t = texto.toLowerCase();
  const imp: ImpactoConversa = { ...VAZIO, relacoes: {}, chips: [] };

  const somar = (
    campo: "heat" | "moral" | "aprovacao" | "tensao" | "sofiaEstresse" | "sofiaEnergia",
    v: number,
  ) => {
    imp[campo] += v;
  };

  // ── Posição pública boa: aprovação sobe, moral sobe, tensão cai ────────
  if (
    /(caridade|doar|doação|doacao|renascer|ajudar|favela|hospital|escola|bolsa|obra pública|obra publica)/.test(
      t,
    )
  ) {
    somar("aprovacao", 2);
    somar("moral", 1);
    somar("tensao", -1);
    imp.chips.push("aprovação +2", "tensão -1");
  }
  if (
    /(obrigad|agradeç|agradec|parabéns|parabens|bom trabalho|orgulho de vocês|orgulho de voces)/.test(
      t,
    )
  ) {
    somar("moral", 2);
    somar("tensao", -1);
    imp.chips.push("moral +2");
  }
  if (
    /(transparência|transparencia|prestação de contas|prestacao de contas|auditável|auditavel|nota fiscal)/.test(
      t,
    )
  ) {
    somar("aprovacao", 1);
    somar("heat", -1);
    imp.chips.push("heat -1");
  }
  if (/(paz|acordo|reconciliar|reconciliação|reconciliacao|fechar a rixa|unidos)/.test(t)) {
    somar("tensao", -2);
    somar("moral", 1);
    imp.chips.push("tensão -2");
  }

  // ── Postura dura: heat sobe, moral cai, conselho racha mais ───────────
  if (
    /(destruir|elimin|aniquil|vou queimar|queimar todos|vingança|vinganca|odio|ódio|ameaç|ameac)/.test(
      t,
    )
  ) {
    somar("heat", 3);
    somar("moral", -1);
    somar("tensao", 2);
    imp.chips.push("heat +3", "tensão +2");
  }
  if (
    /(demitir todos|demitir em massa|cortar cabeças|cortar cabecas|escrál|escral|lixo|competição é morta|competicao e morta)/.test(
      t,
    )
  ) {
    somar("moral", -2);
    somar("tensao", 1);
    imp.chips.push("moral -2");
  }
  if (/(roubar|desvio|propina|suborno|fora da lei|ilegal|esquema|lavagem)/.test(t)) {
    somar("heat", 4);
    somar("aprovacao", -2);
    imp.chips.push("heat +4", "aprovação -2");
  }
  if (/(conselho é um|conselho e um|bando de|inútil|inutil|imbecil|burro)/.test(t)) {
    somar("tensao", 2);
    imp.chips.push("tensão +2");
  }

  // ── Dinheiro falado em voz alta: a Sofia ouve tudo ────────────────────
  if (
    /(gastar|gasto|comprar|compra|milhões|milhoes|bilhões|bilhoes|libera.*verba|queimar dinheiro)/.test(
      t,
    )
  ) {
    somar("sofiaEstresse", 3);
    imp.chips.push("Sofia: estresse +3");
  }

  // ── calor com a Sofia no canal aberto ─────────────────────────────────
  if (/(te amo|amo você|amo voce|gostosa|linda|beijo|cama|vem cá|vem ca)/.test(t)) {
    somar("sofiaEnergia", 4);
    somar("sofiaEstresse", -2);
    imp.chips.push("Sofia: calor +4");
  }

  // ── CEOs citados por nome: relação reage ao clima da fala ─────────────
  const positivo = /(parabéns|parabens|obrigad|confio|excelente|melhor equipe|mandaram bem)/.test(
    t,
  );
  const negativo =
    /(você é demitido|voce e demitido|fracass|incompetên|incompeten|patético|patetico|lixo)/.test(
      t,
    );
  for (const perfil of PERFIS_CEO) {
    const nome = perfil.nome.toLowerCase();
    const primeiro = nome.split(" ")[0];
    if (t.includes(nome) || (primeiro.length > 4 && t.includes(primeiro))) {
      const d = positivo ? 2 : negativo ? -3 : 0;
      if (d !== 0) {
        imp.relacoes[perfil.relacaoChave] = (imp.relacoes[perfil.relacaoChave] ?? 0) + d;
        imp.chips.push(`${primeiro} ${d > 0 ? "+" : ""}${d}`);
      }
    }
  }

  imp.peso =
    Math.abs(imp.heat) +
    Math.abs(imp.moral) +
    Math.abs(imp.aprovacao) +
    Math.abs(imp.tensao) +
    Object.values(imp.relacoes).reduce((a, b) => a + Math.abs(b), 0);
  return imp;
}

/** Aplica o impacto nos números do estado, com clamp de faixa. */
export function aplicarImpacto(estado: EstadoRP, imp: ImpactoConversa): EstadoRP {
  const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(v)));
  const relacoes = { ...estado.relacoes };
  for (const [nome, d] of Object.entries(imp.relacoes)) {
    relacoes[nome] = clamp((relacoes[nome] ?? 50) + d, -100, 100);
  }
  return {
    ...estado,
    heat: clamp(estado.heat + imp.heat),
    moral: clamp(estado.moral + imp.moral),
    aprovacao: clamp(estado.aprovacao + imp.aprovacao),
    mundo: { ...estado.mundo, tensao: clamp(estado.mundo.tensao + imp.tensao) },
    sofia: {
      estresse: clamp(estado.sofia.estresse + imp.sofiaEstresse),
      energia: clamp(estado.sofia.energia + imp.sofiaEnergia),
    },
    relacoes,
  };
}

/* ------------------------------------------------------------------ */
/* Resposta local (IA off) — Axiom no canal aberto                     */
/* ------------------------------------------------------------------ */

export function respostaLocalGeral(estado: EstadoRP, texto: string): string {
  const t = texto.toLowerCase();
  const r = rng((estado.seed ^ (estado.turno * 40503) ^ (texto.length * 7)) >>> 0);
  const resumo = resumoMensal(estado);
  const conflito = estado.mundo.conflitos[0];
  const pendencia = estado.pendencias.find((p) => p.ativa);
  const ultima = estado.feed[0]?.titulo;
  const ceoCitado = PERFIS_CEO.find((p) => t.includes(p.nome.toLowerCase().split(" ")[0]));

  if (ceoCitado) {
    const rel = estado.relacoes[ceoCitado.relacaoChave] ?? 50;
    return `${ceoCitado.nome} (${ceoCitado.cargo}, ${ceoCitado.divisao}) tá com relação ${rel}/100 pra gente. ${
      rel >= 70
        ? "Com ele eu não preciso nem intermediar — manda direto."
        : rel >= 40
          ? "Frio, mas funcional. Se você elogiar em público ele dobra o resultado."
          : "Hostil. Tudo que sai daqui ele lê como ameaça — cuida o que fala com o nome dele no ar."
    }`;
  }

  if (/(caixa|dinheiro|patrimônio|patrimonio|holding|coin)/.test(t)) {
    return sorteia(r, [
      `Tô te ouvindo no canal aberto, boss man — e o 130º inteiro também. Caixa em ${fmtUSD(estado.caixa)}, grupo em $3,8tri, Space Coin a $${estado.coin.toFixed(2)}. Se o passo for grande, a Sofia já sabe antes de você terminar a frase.`,
      `${fmtUSD(estado.caixa)} de caixa livre, cartão corporativo em $${(estado.cartao * 1000).toFixed(1)}M de limite. Fala alto que o conselho gosta de número que chega sem nota.`,
      `Pessoal seu: ${fmtUSD(estado.pessoal)}. Holding: $3,8tri. Essa conta é a única que a Sofia audita duas vezes — ela confia em você, não em mim.`,
    ]);
  }
  if (/(conselho|diretoria|reunião|reuniao|ata)/.test(t)) {
    return `Conselho em ${estado.mundo.tensao}/100${
      conflito
        ? ` — ${conflito.entre} × ${conflito.sobre} ainda ronca`
        : " e quieto, o que me preocupa mais"
    }. No canal aberto eles escutam tudo, boss man. Use isso a favor.`;
  }
  if (/(sofia|noah|casa|greenwich|família|familia)/.test(t)) {
    return `Sofia tá em ${estado.sofia.estresse}/100 de estresse e ${estado.sofia.energia}/100 de energia. ${
      estado.sofiaNaCasa
        ? "Tá em Greenwich agora."
        : "Se você for pra casa, ela decide se vai junto — eu só abro a porta do helicóptero."
    }`;
  }
  if (/(pendência|pendencia|pendurado|em aberto|problema)/.test(t) && pendencia) {
    return `A pendência que ronca mais é "${pendencia.nome}" — ${pendencia.descricao}. Tá no passo ${pendencia.passo} das ${pendencia.etapas.length}. O resto é ruído.`;
  }
  if (/(feed|manchete|midia|mídia|imprensa|mr times|jornal)/.test(t)) {
    return `Última manchete na mesa: "${ultima ?? "nada ainda"}". A imprensa plantada na torre copia o que é dito aqui em quinze minutos — então o canal é o seu microfone e o seu risco.`;
  }
  if (/(plano|mês|mes|semana|próximo|proximo|meta|diretriz)/.test(t)) {
    return `Mês fechando a ${fmtUSD(resumo.lucro)} de lucro, diretriz: ${estado.plano.diretriz}. Semana ${estado.calendario.semana}/4. Tudo que você disser aqui o império inteiro escuta — então escolhe as palavras como escolhe os números.`;
  }
  if (/(segurança|seguranca|ameaça|ameaca|proteção|protecao|guarda)/.test(t)) {
    return `Segurança do 130º e da torre: blindada, jammer ligado, sem rotina de foto. Se virar coisa pública eu troco a rota do dia inteiro — me avisa antes.`;
  }
  return sorteia(r, [
    `Canal aberto, boss man. Eu escuto, o 130º escuta, e o que sai daqui vira manchete no MR Times antes do almoço. Fala.`,
    `Tô contigo. ${ultima ? `Depois de "${ultima}", ` : ""}o conselho tá em ${estado.mundo.tensao}/100 e a moral do grupo em ${estado.moral}. O que a gente joga no canal hoje?`,
    `Ouvi. Semana ${estado.calendario.semana}/4, ${estado.heat} de heat, ${estado.aprovacao} de aprovação com o povo. Manda a próxima.`,
    `Pode falar — mas lembra que ${ceoCitado ? "quem você citar" : "os doze CEOs"} tão de ouvido aberto. ${conflito ? `${conflito.entre} vai usar qualquer palavra solta contra a gente.` : "Sem conflito aberto, o que dá margem pra você arriscar mais."}`,
    `Registrado. Eu anoto, o conselho anota, e a Sofia audita depois. Se for ordem de gestão, manda pela caixa de ordem que aí vira semana e vira número.`,
  ]);
}

/* ------------------------------------------------------------------ */
/* Repercussão: quem do império reage ao que foi dito                  */
/* ------------------------------------------------------------------ */

export interface Repercussao {
  /** Chat de destino: "sofia" | "axiom" | id de CEO. */
  canal: string;
  de: string;
  texto: string;
}

/**
 * Determinístico: o que foi dito no canal aberto ecoa nos chats privados.
 * Sofia comenta dinheiro/calor; CEOs citados respondem; o Axiom fecha.
 */
export function repercussaoChat(
  estado: EstadoRP,
  texto: string,
  imp: ImpactoConversa,
): Repercussao[] {
  const t = texto.toLowerCase();
  const r = rng((estado.seed ^ (estado.turno * 69069) ^ (texto.length * 131)) >>> 0);
  const saidas: Repercussao[] = [];

  if (/(gastar|gasto|comprar|compra|milhões|milhoes|bilhões|bilhoes|verba)/.test(t)) {
    saidas.push({
      canal: "sofia",
      de: "Sofia Mendes",
      texto: sorteia(r, [
        `Eu ouvi o que vocês falaram no canal aberto. ${fmtUSD(estado.caixa)} em caixa não é passe livre, Ryan — é combustível com destino declarado. Me manda o memorando.`,
        "Falar de dinheiro no 130º inteiro ouvindo é coragem. Agora vem o memorando pra mim, com número e prazo. Eu sou auditável mesmo quando você não é.",
      ]),
    });
  }
  if (imp.aprovacao >= 2) {
    saidas.push({
      canal: "sofia",
      de: "Sofia Mendes",
      texto: `Aprovação subindo com o que você falou lá em cima. Continua assim que o povo esquece o heat até o fechamento do mês.`,
    });
  }
  if (imp.heat >= 3) {
    saidas.push({
      canal: "axiom",
      de: "Axiom",
      texto: `Boss man, o que você jogou no canal aberto já saiu do elevador. Heat em ${estado.heat}/100. Se a imprensa pegar, eu seguro com manchete maior — mas me avisa antes da próxima.`,
    });
  }

  for (const [nome, d] of Object.entries(imp.relacoes)) {
    const perfil = PERFIS_CEO.find((p) => p.relacaoChave === nome);
    if (!perfil) continue;
    saidas.push({
      canal: perfil.id,
      de: perfil.nome,
      texto:
        d > 0
          ? sorteia(r, [
              `Escutei o que o Ryan disse no canal aberto. Pra mudança de tom, eu dobro o resultado deste mês.`,
              `Anotado. Esse tipo de palavra vale mais que bônus. O time já sabe.`,
            ])
          : sorteia(r, [
              `Foi dito no canal aberto, então não é off the record. Eu registro — e o jurídico também.`,
              `Interessante. Vou guardar essa exatamente como ouvi, Dalbert. Com data.`,
            ]),
    });
  }

  return saidas.slice(0, 3);
}

/* ------------------------------------------------------------------ */
/* Contexto de IA — o canal aberto com o estado inteiro                */
/* ------------------------------------------------------------------ */

export function promptGeral(estado: EstadoRP): string {
  const conflitos = estado.mundo.conflitos
    .map((c) => `${c.entre} × ${c.sobre} (nível ${c.nivel})`)
    .join("; ");
  const pendencias = estado.pendencias
    .filter((p) => p.ativa)
    .map((p) => p.nome)
    .join(", ");
  return `CANAL ABERTO DO 130º ANDAR — todos ouvem: Sofia (CFO/esposa), os 12 CEOs, o conselho e a imprensa plantada na torre.
ESTADO DO IMPÉRIO:
- Data: ${estado.data} · semana ${estado.calendario.semana}/4 · diretriz: ${estado.plano.diretriz}
- Holding: $3,8tri · caixa: ${fmtUSD(estado.caixa)} · cartão: ${fmtUSD(estado.cartao)} · pessoal Ryan: ${fmtUSD(estado.pessoal)}
- Heat ${estado.heat}/100 · moral ${estado.moral}/100 · aprovação ${estado.aprovacao}/100 · tensão do conselho ${estado.mundo.tensao}/100 (${estado.mundo.clima})
- Conflitos: ${conflitos || "nenhum"}
- Pendências: ${pendencias || "nenhuma"}
- Última semana: ${estado.mundo.ultimaSemana.join(" | ")}`;
}
