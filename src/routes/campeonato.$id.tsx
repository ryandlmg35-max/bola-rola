import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";

import { ClientOnly } from "@/components/ClientOnly";
import { Layout } from "@/components/Layout";
import { Tabela } from "@/components/Tabela";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEFS, getDef } from "@/sim/competicoes";
import { calcularTabela, useSim } from "@/sim/store";
import type { Competicao, Etapa, Partida } from "@/sim/types";

export const Route = createFileRoute("/campeonato/$id")({
  beforeLoad: ({ params }) => {
    if (!DEFS.some((d) => d.id === params.id)) throw notFound();
  },
  head: ({ params }) => {
    const def = DEFS.find((d) => d.id === params.id);
    const titulo = `${def?.nome ?? "Competição"} — Simulador Futebol`;
    const desc = def?.observacao ?? "Classificação e resultados simulados.";
    return {
      meta: [
        { title: titulo },
        { name: "description", content: desc },
        { property: "og:title", content: titulo },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: Pagina,
});

function Pagina() {
  return (
    <Layout>
      <ClientOnly>
        <Conteudo />
      </ClientOnly>
    </Layout>
  );
}

function Conteudo() {
  const { id } = Route.useParams();
  const def = getDef(id);
  const st = useSim();
  const comp = st.competicoes[id];

  useEffect(() => {
    st.garantirCompeticao(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!comp) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Preparando {def.nome}… Se nada aparecer, simule primeiro as ligas que definem os
        classificados (Séries A/B e ligas europeias).
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{comp.nome}</h1>
            <p className="text-sm text-muted-foreground">
              Temporada {comp.temporada} · {comp.clubes.length} clubes
            </p>
          </div>
          <Badge variant={comp.implementado === "completo" ? "default" : "secondary"}>
            {comp.implementado === "completo"
              ? "Formato completo"
              : "Formato simplificado"}
          </Badge>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{comp.observacao}</p>
        {comp.campeao ? (
          <p className="mt-3 font-semibold text-primary">
            Campeão: {st.clubes[comp.campeao]?.nome}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => st.simularRodada(id)}>Simular rodada</Button>
          <Button variant="secondary" onClick={() => st.simularTurno(id)}>
            Simular turno
          </Button>
          <Button variant="outline" onClick={() => st.simularCompeticao(id)}>
            Simular competição
          </Button>
        </div>
      </header>

      {comp.etapas.map((etapa) => (
        <EtapaBloco key={etapa.id} etapa={etapa} comp={comp} />
      ))}
    </div>
  );
}

function EtapaBloco({ etapa, comp }: { etapa: Etapa; comp: Competicao }) {
  const clubes = useSim((s) => s.clubes);
  const rodadas = [...new Set(etapa.partidas.map((p) => p.rodada))].sort((a, b) => a - b);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{etapa.nome}</h2>

      {etapa.gruposIds ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Object.entries(etapa.gruposIds).map(([nome, ids]) => (
            <Tabela
              key={nome}
              titulo={nome}
              clubes={clubes}
              zonas={comp.zonas}
              linhas={calcularTabela(
                ids,
                etapa.partidas.filter((p) => p.fase === nome),
              )}
            />
          ))}
        </div>
      ) : comp.tipo === "liga" || comp.tipo === "liga-c" || comp.tipo === "suico" ? (
        <Tabela
          clubes={clubes}
          zonas={comp.zonas}
          linhas={calcularTabela(comp.clubes, etapa.partidas)}
        />
      ) : null}

      <details className="rounded-xl border border-border bg-card">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
          Jogos ({etapa.partidas.filter((p) => p.golsCasa !== null).length}/
          {etapa.partidas.length} disputados)
        </summary>
        <div className="space-y-4 border-t border-border p-4">
          {rodadas.map((r) => (
            <div key={r}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Rodada {r}
              </p>
              <div className="grid gap-1 sm:grid-cols-2">
                {etapa.partidas
                  .filter((p) => p.rodada === r)
                  .map((p) => (
                    <Jogo key={p.id} p={p} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

function Jogo({ p }: { p: Partida }) {
  const clubes = useSim((s) => s.clubes);
  const placar =
    p.golsCasa === null ? "–" : `${p.golsCasa} x ${p.golsFora}`;
  const penaltis =
    p.penaltisCasa !== undefined && p.golsCasa !== null
      ? ` (${p.penaltisCasa}-${p.penaltisFora} pên.)`
      : "";
  return (
    <div className="flex items-center gap-2 rounded-md bg-background/40 px-3 py-1.5 text-sm">
      <span className="flex-1 truncate text-right">{clubes[p.casa]?.nome}</span>
      <span className="w-24 shrink-0 text-center font-semibold">
        {placar}
        <span className="text-[10px] font-normal text-muted-foreground">{penaltis}</span>
      </span>
      <span className="flex-1 truncate">{clubes[p.fora]?.nome}</span>
    </div>
  );
}
